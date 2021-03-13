import Vue from 'vue';
import Vuetify from 'vuetify/lib';

// Colors
import colors from 'vuetify/lib/util/colors';

import { mdiDatabaseRefreshOutline } from '@mdi/js';
import DiceMultipleOutlineIcon from '@/components/icons/DiceMultipleOutlineIcon.vue';
import DotsGridIcon from '@/components/icons/DotsGridIcon.vue';
import NetworkIcon from '@/components/icons/NetworkIcon.vue';

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    values: {
      mdiDatabaseRefreshOutline,
      diceMultipleOutline: {
        component: DiceMultipleOutlineIcon,
      },
      dotsGrid: {
        component: DotsGridIcon,
      },
      network: {
        component: NetworkIcon,
      },
    },
  },
  theme: {
    themes: {
      light: {
        primary: colors.grey.base,
        secondary: colors.grey.lighten2,
        accent: colors.grey.darken2,
        project: {
          base: colors.teal.base, //'#93b5ad',
          darken1: colors.teal.darken1,
          // darken1: '#84A29B',
        },
        model: {
          base: colors.orange.darken4, //'#be6442',
        },
        settings: {
          base: colors.deepPurple.base, //'#ce934a',
        },
      },
    },
  },
});
