/**
 * @module app/adapter/view/vue
 */
import 'src/app/component/components';
import VueRouter from 'vue-router';
import utils from 'src/core/service/util.service';
import VueMoment from 'vue-moment';

/**
 * Contains the global Vue.js components
 * @type {{}}
 */
const vueComponents = {};

/**
 * @method VueAdapter
 * @memberOf module:app/adapter/view/vue
 * @param context
 * @param componentFactory
 * @returns {VueAdapter}
 */
export default function VueAdapter(context, componentFactory, stateFactory, Vue) {
    Vue.use(VueRouter);
    Vue.use(VueMoment);

    /**
     * Extend Vue prototype to access super class for component inheritance.
     */
    Object.defineProperties(Vue.prototype, {
        $super: {
            get() {
                /**
                 * Registers a proxy as the $super property on every instance.
                 * Makes it possible to dynamically access methods of an extended component.
                 */
                return new Proxy(this, {
                    get(target, key) {
                        /** Fallback method which will be returned if the called method does not exist on a super class. */
                        function empty() {
                            utils.warn('View', `The method "${key}" is not defined in any super class.`, target);
                        }

                        /**
                         * Recursively search for a method in super classes.
                         * This enables multi level inheritance.
                         */
                        function getSuperMethod(comp, methodName) {
                            if (comp.extends && comp.extends.methods && comp.extends.methods[methodName]) {
                                return comp.extends.methods[methodName];
                            } else if (comp.extends.extends) {
                                return getSuperMethod(comp.extends, methodName);
                            }

                            return empty;
                        }

                        return getSuperMethod(target.constructor.options, key).bind(target);
                    }
                });
            }
        }
    });

    Vue.filter('image', (value) => {
        if (!value) {
            return '';
        }

        return `${context.assetsPath}${value}`;
    });

    Vue.filter('currency', (value, format = 'EUR') => {
        return utils.currency(value, format);
    });

    Vue.filter('date', (value) => {
        return utils.date(value);
    });

    return {
        createInstance,
        initComponents,
        createComponent,
        getComponent,
        getComponents,
        getWrapper,
        getName
    };

    /**
     * Creates the main instance for the view layer.
     * Is used on startup process of the main application.
     *
     * @param renderElement
     * @param router
     * @param providers
     * @memberOf module:app/adapter/view/vue
     * @returns {Vue}
     */
    function createInstance(renderElement, router, providers) {
        const components = getComponents();

        // We need the store instance to inject it into the Vue constructor
        const store = stateFactory.initialize(Vue);

        // Enables to see the router changes in VueX
        stateFactory.mapRouterToState(router);

        return new Vue({
            el: renderElement,
            router,
            store,
            components,
            template: '<sw-admin />',
            provide() {
                return providers;
            }
        });
    }

    /**
     * Initializes all core components as Vue components.
     *
     * @memberOf module:app/adapter/view/vue
     * @returns {Object}
     */
    function initComponents() {
        const componentRegistry = componentFactory.getComponentRegistry();

        componentRegistry.forEach((component) => {
            createComponent(component.name);
        });

        return vueComponents;
    }

    /**
     * Returns the component as a Vue component.
     * Includes the full rendered template with all overrides.
     *
     * @param componentName
     * @memberOf module:app/adapter/view/vue
     * @returns {Function}
     */
    function createComponent(componentName) {
        const componentConfig = Shopware.Component.build(componentName);

        if (!componentConfig) {
            return false;
        }

        const vueComponent = Vue.component(componentName, componentConfig);
        vueComponents[componentName] = vueComponent;

        return vueComponent;
    }

    /**
     * Returns a final Vue component by its name.
     *
     * @param componentName
     * @memberOf module:app/adapter/view/vue
     * @returns {null|Component}
     */
    function getComponent(componentName) {
        if (!vueComponents[componentName]) {
            return null;
        }

        return vueComponents[componentName];
    }

    /**
     * Returns the complete set of available Vue components.
     *
     * @memberOf module:app/adapter/view/vue
     * @returns {Object}
     */
    function getComponents() {
        return vueComponents;
    }

    /**
     * Returns the adapter wrapper
     *
     * @memberOf module:app/adapter/view/vue
     * @returns {Vue}
     */
    function getWrapper() {
        return Vue;
    }

    /**
     * Returns the name of the adapter
     *
     * @memberOf module:app/adapter/view/vue
     * @returns {string}
     */
    function getName() {
        return 'Vue.js';
    }
}
