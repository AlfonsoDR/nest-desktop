<template>
  <div class="projectView" v-if="projectView.state.project">
    <ProjectBar />

    <v-navigation-drawer
      :mini-variant="!projectView.state.toolOpened"
      :style="{ transition: state.resizing ? 'initial' : '' }"
      :width="projectView.state.tool != null ? projectView.state.tool.width : 0"
      app
      class="no-print nav-controller"
      clipped
      mobile-breakpoint="64"
      mini-variant-width="64"
      permanent
      right
    >
      <div
        @mousedown="resizeSidebar"
        class="resize-handle"
        v-if="projectView.state.toolOpened"
      />
      <v-row class="fill-height ml-0" no-gutters>
        <v-navigation-drawer
          absolute
          mini-variant
          mobile-breakpoint="64"
          mini-variant-width="64"
          right
        >
          <v-list nav>
            <v-list-item
              :class="{
                'v-list-item--active':
                  projectView.state.tool === tool &&
                  projectView.state.toolOpened,
              }"
              :key="tool.name"
              :title="tool.title"
              @click="projectView.selectTool(tool)"
              v-for="tool in projectView.tools"
              v-show="tool.devMode ? appConfig.devMode : true"
            >
              <v-list-item-icon>
                <v-list-item-group class="nav-item-right">
                  <span v-if="tool.name !== 'activityEdit'">
                    <v-icon v-text="tool.icon" />
                  </span>
                  <span v-else>
                    <ActivityGraphIcon
                      :project="projectView.state.project"
                      v-if="
                        projectView.state.project.state.activities.hasSomeEvents
                      "
                    />
                    <v-icon
                      class="rotate-90"
                      v-else
                      v-text="'mdi-border-style'"
                    />
                  </span>
                  <div v-text="tool.title" />
                </v-list-item-group>
              </v-list-item-icon>
              <v-list-item-content />
            </v-list-item>
          </v-list>
        </v-navigation-drawer>

        <div class="controller" v-if="projectView.state.toolOpened">
          <NetworkParamEdit
            :network="projectView.state.project.network"
            :projectId="projectView.state.projectId"
            v-if="projectView.state.tool.name === 'networkParamEdit'"
          />

          <SimulationKernel
            :simulation="projectView.state.project.simulation"
            v-if="projectView.state.tool.name === 'simulationKernel'"
          />

          <SimulationCodeEditor
            :code="projectView.state.project.simulation.code"
            color="project"
            v-if="projectView.state.tool.name === 'codeEditor'"
          />

          <ActivityChartController
            :graph="projectView.state.project.activityGraph.activityChartGraph"
            v-if="
              projectView.state.tool.name === 'activityEdit' &&
              projectView.state.activityGraph === 'abstract'
            "
          />

          <ActivityAnimationController
            :graph="
              projectView.state.project.activityGraph.activityAnimationGraph
            "
            v-if="
              projectView.state.tool.name === 'activityEdit' &&
              projectView.state.activityGraph === 'spatial'
            "
          />

          <ActivityStats
            :project="projectView.state.project"
            v-if="projectView.state.tool.name === 'activityStats'"
          />

          <v-card flat tile v-if="projectView.state.tool.name === 'docJSON'">
            <CodeMirror :data="projectView.state.project.doc" />
          </v-card>
          <v-card flat tile v-if="projectView.state.tool.name === 'dataJSON'">
            <CodeMirror :data="projectView.state.project.toJSON()" />
          </v-card>
        </div>
      </v-row>
    </v-navigation-drawer>

    <v-main>
      <transition name="fade">
        <div
          :style="{ height: projectView.state.networkGraphHeight }"
          ref="networkGraph"
          v-if="[0, 2].includes(projectView.state.modeIdx)"
        >
          <NetworkEditor
            :networkHash="projectView.state.project.network.state.hash"
            :projectId="projectView.state.projectId"
          />
        </div>
      </transition>

      <transition name="fade">
        <ActivityGraph
          :activitiesHash="
            projectView.state.project.activities.map(a => a.hash)
          "
          :codeHash="projectView.state.project.simulation.code.hash"
          :graph="projectView.state.project.activityGraph"
          :graphCodeHash="projectView.state.project.activityGraph.codeHash"
          :view="projectView.state.activityGraph"
          showHelp
          v-if="projectView.state.modeIdx === 1"
        />
      </transition>

      <transition name="fade">
        <ProjectLabBook v-if="projectView.state.modeIdx === 2" />
      </transition>
    </v-main>

    <v-overlay
      :value="
        projectView.state.project.simulation.state.running &&
        !projectView.state.project.simulation.code.runSimulationInsite
      "
      :z-index="10"
    >
      <v-progress-circular
        :size="70"
        :width="7"
        color="amber"
        dark
        indeterminate
      />
    </v-overlay>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { onMounted, reactive, watch } from '@vue/composition-api';
import axios from 'axios';

import ActivityGraph from '@/components/activity/ActivityGraph.vue';
import ActivityGraphIcon from '@/components/activity/ActivityGraphIcon.vue';
import ActivityChartController from '@/components/activity/activityChart/ActivityChartController.vue';
import ActivityAnimationController from '@/components/activity/activityAnimation/ActivityAnimationController.vue';
import ActivityStats from '@/components/activity/activityStats/ActivityStats.vue';
import CodeMirror from '@/components/CodeMirror.vue';
import core from '@/core';
import NetworkEditor from '@/components/network/NetworkEditor.vue';
import NetworkParamEdit from '@/components/network/NetworkParamEdit.vue';
import ProjectBar from '@/components/project/ProjectBar.vue';
import ProjectLabBook from '@/components/project/ProjectLabBook.vue';
import SimulationButton from '@/components/simulation/SimulationButton.vue';
import SimulationCodeEditor from '@/components/simulation/SimulationCodeEditor.vue';
import SimulationKernel from '@/components/simulation/SimulationKernel.vue';

export default Vue.extend({
  name: 'ProjectView',
  components: {
    ActivityAnimationController,
    ActivityChartController,
    ActivityGraph,
    ActivityGraphIcon,
    ActivityStats,
    CodeMirror,
    NetworkEditor,
    NetworkParamEdit,
    ProjectBar,
    ProjectLabBook,
    SimulationButton,
    SimulationCodeEditor,
    SimulationKernel,
  },
  props: {
    id: String,
  },
  setup(props, { root }) {
    const projectView = core.app.project.view;
    const state = reactive({
      editing: false,
      error: false,
      resizing: false,
      simulationMenu: {
        position: { x: 0, y: 0 },
        show: false,
      },
    });

    /**
     * Load project using query or projectId
     */
    const loadProject = () => {
      state.editing = false;

      if (root.$route.query.from) {
        // URL contains a from-query, like in http://localhost:54286/#/project/?from=https://raw.githubusercontent.com/nest-desktop/nest-desktop/v3.2/src/assets/projects/spike-activity.json
        const url: string = root.$route.query.from as string;
        axios.get(url).then((response: any) => {
          if (Array.isArray(response.data)) {
            response.data.forEach((project: any) => {
              core.app.project.createNewProject(project);
            });
          } else {
            core.app.project.createNewProject(response.data);
          }
        });
      } else {
        projectView.init().then(() => {
          setTimeout(() => {
            const project = projectView.state.project;
            // Create a new project when route path doesn't match with valid project id.
            if (!root.$route.path.endsWith(project.id)) {
              root.$router.push({
                path: `/project`,
              });
            }
          })
        });
      }
    };

    /**
     * Handle mouse move on resizing.
     * @param e MouseEvent from which the x position is taken
     */
    const handleMouseMove = (e: MouseEvent) => {
      window.getSelection().removeAllRanges();
      const width = window.innerWidth - e.clientX;
      if (width === projectView.state.tool['minWidth']) {
        return;
      }
      projectView.state.tool['width'] =
        width > projectView.state.tool['minWidth']
          ? width
          : projectView.state.tool['minWidth'];
      window.dispatchEvent(new Event('resize'));
    };

    /**
     * Handle mouse up on resizing.
     */
    const handleMouseUp = () => {
      state.resizing = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.dispatchEvent(new Event('resize'));
    };

    /**
     * Resize sidebar.
     */
    const resizeSidebar = () => {
      state.resizing = true;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    onMounted(() => {
      projectView.state.projectId = props.id as string;
      loadProject();
    });

    watch(
      () => props.id,
      (id: string) => {
        projectView.state.projectId = id;
        loadProject();
      }
    );

    return {
      appConfig: core.app.config,
      nestSimulatorState: core.app.backends.nestSimulator.state,
      projectView,
      resizeSidebar,
      state,
    };
  },
});
</script>

<style>
.projectView {
  height: 100vh;
  overflow-y: hidden;
}

.projectView .v-toolbar .v-toolbar__title input {
  font-size: 1.25rem;
  text-align: center;
}

.projectView .v-toolbar .v-toolbar__title .v-input__icon--append {
  opacity: 0;
}

.projectView .v-toolbar .v-toolbar__title:hover .v-input__icon--append {
  opacity: 1;
}

.projectView .nav-controller > .v-navigation-drawer__content {
  margin-right: 64px;
}

.projectView .nav-controller .controller {
  width: 100%;
}

.projectView .nav-item-right {
  font-size: 9px;
  text-align: center;
  width: 100%;
}

.projectView .resize-handle {
  cursor: ew-resize;
  height: 100%;
  left: 0;
  position: fixed;
  width: 4px;
  z-index: 10;
}

.projectView .rotate-90 {
  transform: rotate(-90deg);
}
</style>
