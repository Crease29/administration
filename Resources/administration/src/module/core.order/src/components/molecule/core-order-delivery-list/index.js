import PaginationMixin from 'src/app/component/mixin/pagination.mixin';
import template from './core-order-delivery-list.html.twig';

export default Shopware.Component.register('core-order-delivery-list', {
    inject: ['orderDeliveryService'],
    mixins: [PaginationMixin],

    props: {
        order: {
            type: Object,
            required: true
        }
    },

    data() {
        return {
            isWorking: false,
            deliveryList: [],
            errors: []
        };
    },

    watch: {
        order: 'getData'
    },

    methods: {
        getData() {
            this.getDeliveryList();
        },

        getDeliveryList(offset = this.offset, limit = this.limit) {
            this.isWorking = true;
            this.orderDeliveryService
                .getList(offset, limit, this.order.uuid)
                .then((response) => {
                    this.deliveryList = response.data;
                    this.errors = response.errors;
                    this.total = response.total;
                    this.isWorking = false;
                });
        },

        handlePagination(offset, limit) {
            this.getDeliveryList(offset, limit);
        }
    },
    template
});
