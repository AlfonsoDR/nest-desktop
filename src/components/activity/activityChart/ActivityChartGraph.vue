<template>
  <div class="activityChartGraph">
    <v-dialog max-width="290" v-model="state.graph.state.dialog">
      <v-card>
        <v-card-title v-text="'Download plot'" />

        <v-card-text>
          <v-row no-gutters>
            <v-col cols="8">
              <v-subheader v-text="'Image format'" />
            </v-col>

            <v-col cols="4">
              <v-select
                :items="state.imageFormats"
                dense
                label="Select image format"
                single-line
                v-model="state.toImageButtonOptions.format"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog()" text v-text="'Cancel'" />
          <v-btn @click="downloadImage()" text v-text="'Download'" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div class="activityChartGraphContent" ref="activityChartGraph" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from '@vue/composition-api';

import { ActivityChartGraph } from '@/core/activity/activityChart/activityChartGraph';

export default Vue.extend({
  name: 'ActivityChartGraph',
  props: {
    graph: ActivityChartGraph,
  },
  setup(props) {
    const state = reactive({
      dialog: false,
      graph: props.graph as ActivityChartGraph,
      imageFormats: ['jpeg', 'png', 'svg', 'webp'],
      toImageButtonOptions: {
        filename: 'nest-desktop',
        format: 'png', // png, svg, jpeg, webp
        // height: 600,
        // scale: 1, // Multiply title/legend/axis/canvas sizes by this factor
        // width: 800,
      },
    });
    const activityChartGraph = ref(null);

    const init = () => {
      state.graph = props.graph as ActivityChartGraph;
      const ref: any = activityChartGraph.value;
      if (ref) {
        state.graph.newPlot(ref);
      }

      // On zoom behavior
      ref.on('plotly_relayout', () => {
        state.graph.restyle();
      });

      // On resize behavior
      ref.on('plotly_resize', () => {
        state.graph.restyle();
      });
    };

    /**
     * Close dialog.
     */
    const closeDialog = () => {
      state.graph.state.dialog = false;
    };

    /**
     * Download image of the current plot.
     */
    const downloadImage = () => {
      closeDialog();
      const date: string = new Date().toISOString();
      state.toImageButtonOptions.filename = `nest_desktop-${state.graph.project.name}-${date}`;
      state.graph.downloadImage(state.toImageButtonOptions);
    };

    /**
     * Resize activity graph.
     */
    const onResize = () => {
      state.graph.update();
    };

    onMounted(() => {
      init();
      window.addEventListener('resize', onResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', onResize);
    });

    watch(
      () => props.graph,
      () => init()
    );

    return {
      activityChartGraph,
      closeDialog,
      downloadImage,
      state,
    };
  },
});
</script>

<style>
.activityChartGraph .activityChartGraphContent {
  height: calc(100vh - 48px - 24px);
  width: 100%;
}
</style>
