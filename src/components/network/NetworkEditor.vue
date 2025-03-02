<template>
  <div class="networkEditor" ref="networkEditor">
    <ConnectionMenu
      :connection="state.connectionMenu.connection"
      :position="state.connectionMenu.position"
      v-if="state.connectionMenu.show"
    />

    <NodeMenu
      :node="state.nodeMenu.node"
      :position="state.nodeMenu.position"
      v-if="state.nodeMenu.show"
    />

    <NetworkEditorToolbar
      :graph="state.graph"
      :network="state.network"
      class="no-print"
    />

    <svg height="600" id="networkGraph" ref="networkGraph" width="800">
      <g class="marker" v-if="state.network">
        <defs
          :key="'defs' + connection.idx"
          v-for="connection of state.network.connections"
        >
          <marker
            :id="'generic' + connection.idx"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="6"
            refY="4"
          >
            <path
              :style="{ stroke: connection.source.view.color }"
              d="M2,2L6,4L2,6"
              fill="transparent"
            />
          </marker>

          <marker
            :id="'exc' + connection.idx"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="6"
            refY="4"
          >
            <path
              :style="{
                fill: connection.source.view.color,
                stroke: connection.source.view.color,
              }"
              d="M2,2L6,4L2,6L2,2L6,4"
            />
          </marker>

          <marker
            :id="'inh' + connection.idx"
            markerHeight="6"
            markerWidth="6"
            orient="auto"
            refX="5"
            refY="3"
          >
            <circle
              :style="{
                fill: connection.source.view.color,
                stroke: connection.source.view.color,
              }"
              r="2"
              transform="translate(3,3)"
            />
          </marker>

          <marker
            :id="'assigned' + connection.idx"
            markerHeight="10"
            markerWidth="10"
            orient="auto"
            refX="5"
            refY="5"
          >
            <circle
              :style="{
                fill: 'none',
                stroke: connection.source.view.color,
                opacity: 0.5,
              }"
              r="4"
              transform="translate(5,5)"
            />
          </marker>
        </defs>
      </g>

      <rect
        :fill="
          state.graph && state.graph.config.transparentWorkspace
            ? 'transparent'
            : $vuetify.theme.dark
            ? '#121212'
            : 'white'
        "
        id="workspaceHandler"
      />

      <g id="networkWorkspace">
        <g class="grid no-print" />
        <g v-if="state.graph">
          <path
            :style="{ strokeWidth: state.graph.config.strokeWidth }"
            class="dragline"
            d="M0,0L0,0"
            fill="none"
            stroke-linecap="round"
          />
        </g>

        <g id="modelAssigned" />
        <g id="connections" />
        <g id="nodes" />

        <g id="nodeAddPanel" />
      </g>
    </svg>

    <v-snackbar
      :timeout="-1"
      v-model="state.network.project.state.snackbar.show"
    >
      {{ state.network.project.state.snackbar.text }}

      <template #action="{ attrs }">
        <v-btn
          @click="state.network.project.state.closeSnackbar()"
          outlined
          small
          v-bind="attrs"
          v-if="state.network.project.state.snackbar.actions.length === 0"
        >
          Close
        </v-btn>
        <template
          v-if="state.network.project.state.snackbar.actions.length > 0"
        >
          <v-btn
            :key="actionIdx"
            @click="action.onClick"
            outlined
            small
            v-bind="attrs"
            v-for="(action, actionIdx) in state.network.project.state.snackbar
              .actions"
            v-text="action.text"
          />
        </template>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  ref,
  reactive,
  onBeforeUnmount,
  onMounted,
  watch,
} from '@vue/composition-api';
import * as d3 from 'd3';

import { Connection } from '@/core/connection/connection';
import { NetworkGraph } from '@/core/network/networkGraph/networkGraph';
import { Node } from '@/core/node/node';
import core from '@/core';

import ConnectionMenu from '@/components/connection/ConnectionMenu.vue';
import NodeMenu from '@/components/node/NodeMenu.vue';
import NetworkEditorToolbar from '@/components/network/NetworkEditorToolbar.vue';

export default Vue.extend({
  name: 'NetworkEditor',
  components: {
    ConnectionMenu,
    NetworkEditorToolbar,
    NodeMenu,
  },
  props: {
    networkHash: String,
    projectId: String,
  },
  setup(props) {
    const projectView = core.app.project.view;
    const networkEditor = ref(null);
    const networkGraph = ref(null);
    const state = reactive({
      connectionMenu: {
        connection: undefined,
        position: { x: 0, y: 0 },
        show: false,
      },
      graph: undefined,
      network: projectView.state.project.network,
      nodeMenu: {
        node: undefined,
        position: { x: 0, y: 0 },
        show: false,
      },
    });

    /**
     * Show Menu for connection.
     */
    const showConnectionMenu = (e: MouseEvent, connection: Connection) => {
      e.preventDefault();
      state.connectionMenu.show = false;
      state.connectionMenu.connection = connection;
      state.connectionMenu.position.x = e.clientX;
      state.connectionMenu.position.y = e.clientY;
      setTimeout(() => {
        state.connectionMenu.show = true;
      }, 1);
    };

    /**
     * Show Menu for node.
     */
    const showNodeMenu = (e: MouseEvent, node: Node) => {
      e.preventDefault();
      state.nodeMenu.show = false;
      state.nodeMenu.node = node;
      state.nodeMenu.position.x = e.clientX;
      state.nodeMenu.position.y = e.clientY;
      setTimeout(() => {
        state.nodeMenu.show = true;
      }, 1);
    };

    /**
     * Tigger Menu for node or connection.
     */
    const setMenuTrigger = () => {
      d3.selectAll('g.node').each(
        (node: Node, idx: number, elements: any[]) => {
          d3.select(elements[idx]).on('contextmenu', e => {
            showNodeMenu(e, node);
          });
        }
      );

      d3.selectAll('g.connection').each(
        (connection: Connection, idx: number, elements: any[]) => {
          d3.select(elements[idx]).on('contextmenu', e => {
            showConnectionMenu(e, connection);
          });
        }
      );
    };

    /**
     * Check if nodes with all types are created.
     */
    const hasAllNodeTypes = () => {
      const types: string[] = state.network.nodes.map(
        (node: Node) => node.model.elementType
      );
      return (
        types.includes('stimulator') &&
        types.includes('neuron') &&
        types.includes('recorder')
      );
    };

    /**
     * Show help in snackbar.
     */
    const showHelp = () => {
      if (state.network.project.state.snackbar.important) {
        return;
      }
      state.network.project.state.closeSnackbar();
      if (!projectView.config.showHelp) {
        return;
      }
      if (state.network.nodes.length === 0) {
        state.network.project.state.showSnackbar(
          'Create nodes (use right mouse button).'
        );
      } else if (!hasAllNodeTypes()) {
        state.network.project.state.showSnackbar(
          'Add at least a stimulator, a neuron and a recorder.'
        );
      } else if (state.network.connections.length < 2) {
        state.network.project.state.showSnackbar(
          'Connect I/O-devices to neurons.'
        );
      }
    };

    /**
     * Update network graph.
     */
    const update = () => {
      state.network = projectView.state.project.network;
      state.graph.network = state.network;
      state.graph.update();
      setMenuTrigger();
      showHelp();
    };

    /**
     * Resize network graph.
     */
    const onResize = () => {
      const elem: any = networkEditor.value['parentNode'];
      if (elem) {
        state.graph.workspace.resize(elem.clientWidth, elem.clientHeight);
        state.graph.workspace.updateTransform();
      }
    };

    onMounted(() => {
      const ref: any = networkGraph.value;
      if (ref) {
        state.graph = new NetworkGraph(ref);
        onResize();
        state.graph.workspace.init();
        update();
        state.graph.workspace.update();
        window.addEventListener('resize', onResize);
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', onResize);
    });

    watch(
      () => [props.networkHash, props.projectId],
      () => update()
    );

    watch(
      () => [
        state.network.state.selectedNode,
        state.network.state.selectedConnection,
      ],
      () => {
        // When (un-)select node or connection button outside of the network graph.
        state.graph.update();
      }
    );

    return { state, networkEditor, networkGraph };
  },
});
</script>

<style>
.networkGraph {
  display: inline-block;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.connection {
  cursor: pointer;
}

.node .shape {
  cursor: pointer;
}

.node text {
  font-size: 12px;
  pointer-events: none;
}

.dragline {
  pointer-events: none;
}
</style>
