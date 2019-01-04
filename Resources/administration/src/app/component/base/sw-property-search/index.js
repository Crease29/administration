import { Component, State } from 'src/core/shopware';
import utils from 'src/core/service/util.service';
import template from './sw-property-search.html.twig';
import './sw-property-search.less';

Component.register('sw-property-search', {
    template,

    data() {
        return {
            groups: [],
            groupOptions: [],
            displayTree: false,
            preventSelection: false,
            displaySearch: false,
            currentGroup: null,
            searchTerm: '',
            groupPage: 1,
            optionPage: 1,
            groupTotal: 1,
            optionTotal: 1
        };
    },

    props: {
        collapsible: {
            type: Boolean,
            required: false,
            default: true
        },
        overlay: {
            type: Boolean,
            required: false,
            default: true
        },
        options: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        }
    },

    computed: {
        groupStore() {
            return State.getStore('configuration_group');
        },

        optionStore() {
            return State.getStore('configuration_group_option');
        }
    },

    created() {
        this.createdComponent();
    },

    destroyed() {
        this.destroyedComponent();
    },

    methods: {
        createdComponent() {
            this.groups = [];
            this.groupOptions = [];

            if (this.collapsible) {
                document.addEventListener('click', this.closeOnClickOutside);
                document.addEventListener('keyup', this.closeOnClickOutside);
            } else {
                this.showTree();
            }

            this.$parent.$on('options-loaded', this.addOptionCount);
        },

        destroyedComponent() {
            if (this.collapsible) {
                document.addEventListener('click', this.closeOnClickOutside);
                document.addEventListener('keyup', this.closeOnClickOutside);
            }
        },

        onGroupSelect(selection) {
            const groups = Object.values(selection);

            if (groups.length <= 0) {
                this.groupOptions = [];
                return;
            }

            this.currentGroup = groups.pop();
            groups.forEach((item) => {
                this.$refs.groupGrid.selectItem(false, item);
            });

            this.optionPage = 1;
            this.loadOptions();
        },

        onOptionSelect(params) {
            if (this.preventSelection) {
                return;
            }

            this.$emit('sw-property-search-option-selected', params);
            this.addOptionCount();
        },

        onGroupPageChange(pagination) {
            this.groupPage = pagination.page;
            this.loadGroups();
        },

        onOptionPageChange(pagination) {
            this.optionPage = pagination.page;
            this.loadOptions();
        },

        onOptionSearchPageChange(pagination) {
            this.optionPage = pagination.page;
            this.showSearch();
        },

        onFocusSearch() {
            if (this.searchTerm.length > 0) {
                this.showSearch();
                return;
            }

            this.showTree();
        },

        onSearchOptions: utils.debounce(function debouncedSearch(input) {
            const validInput = input || '';

            this.optionPage = 1;
            this.searchTerm = validInput.trim();
            this.onFocusSearch();
        }, 400),

        closeOnClickOutside(event) {
            if (event.type === 'keyup' && event.key.toLowerCase() !== 'tab') {
                return;
            }

            const target = event.target;

            if (target.closest('.sw-property-search') === null) {
                this.displaySearch = false;
                this.displayTree = false;
            }
        },

        selectOptions(grid) {
            this.preventSelection = true;
            this.options.forEach((option) => {
                grid.selectItem(true, option);
            });
            this.preventSelection = false;
        },

        showSearch() {
            this.displaySearch = true;
            this.displayTree = false;

            const queries = [];
            const terms = this.searchTerm.split(' ');

            terms.forEach((term) => {
                queries.push({
                    query: {
                        type: 'equals',
                        field: 'configuration_group_option.name',
                        value: term
                    },
                    score: 5000
                });

                queries.push({
                    query: {
                        type: 'contains',
                        field: 'configuration_group_option.name',
                        value: term
                    },
                    score: 500
                });

                queries.push({
                    query: {
                        type: 'contains',
                        field: 'configuration_group_option.group.name',
                        value: this.searchTerm
                    },
                    score: 100
                });
            });

            const params = {
                page: this.optionPage,
                limit: 10,
                queries: queries,
                associations: {
                    group: {}
                }
            };

            this.optionStore.getList(params).then((response) => {
                this.groupOptions = response.items;
                this.optionTotal = response.total;
                this.selectOptions(this.$refs.optionSearchGrid);
            });
        },

        showTree() {
            this.displaySearch = false;
            this.displayTree = true;
            this.groupPage = 1;
            this.optionPage = 1;
            if (this.collapsible) {
                this.groupOptions = [];
            }
            this.loadGroups();
        },

        loadGroups() {
            const params = { page: this.groupPage, limit: 10 };

            this.groupStore.getList(params).then((response) => {
                this.groups = response.items;
                this.groupTotal = response.total;
                this.addOptionCount();
            });
        },

        loadOptions() {
            const params = { page: this.optionPage, limit: 10 };

            this.currentGroup.getAssociation('options').getList(params).then((response) => {
                this.groupOptions = response.items;
                this.optionTotal = response.total;
                this.selectOptions(this.$refs.optionGrid);
            });
        },

        addOptionCount() {
            const options = Object.values(this.options.store);

            this.groups.forEach((group) => {
                const optionCount = options.filter((option) => {
                    return option.groupId === group.id && !option.isDeleted;
                });

                this.$set(group, 'optionCount', optionCount.length);
            });
        }
    }
});
