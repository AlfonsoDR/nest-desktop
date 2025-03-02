<template>
  <div class="ProjectsDialog">
    <v-dialog
      max-width="420"
      v-if="dialogState.action === 'reload'"
      v-model="dialogState.open"
    >
      <v-card>
        <v-card-title v-text="'Are you sure to reload all projects?'" />

        <v-card-text>
          The projects will be reloaded from the database.
          <br />
          Any unsaved content in projects will be deleted!
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog" outlined small text v-text="'cancel'" />
          <v-btn @click="reloadProjects" outlined small>
            <v-icon left v-text="'mdi-reload'" />
            reload
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      max-width="480"
      v-else-if="dialogState.action === 'reset'"
      v-model="dialogState.open"
    >
      <v-card>
        <v-card-title v-text="'Are you sure to reset all projects?'" />

        <v-card-text>
          The database for projects will be deleted and then reset.
          <br />
          Your modified projects will be lost! Please export them first!
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog" outlined small text v-text="'cancel'" />
          <v-btn @click="resetProjects" outlined small>
            <v-icon left v-text="'$mdiDatabaseRefreshOutline'" />
            reset
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      max-width="1024"
      v-else-if="dialogState.action === 'import'"
      v-model="dialogState.open"
    >
      <ProjectsImportDialog />
    </v-dialog>

    <v-dialog max-width="1024" v-else v-model="dialogState.open">
      <v-card>
        <v-card-title>
          {{
            dialogState.action.charAt(0).toUpperCase() +
            dialogState.action.slice(1)
          }}
        </v-card-title>
        <v-card-subtitle v-text="`Select projects to ${dialogState.action}`">
        </v-card-subtitle>

        <v-card-text>
          <v-simple-table>
            <template #default>
              <thead>
                <tr>
                  <th v-text="'Project name'" />
                  <th v-text="'Created at'" />
                  <th v-text="'Updated at'" />
                  <th
                    class="text-center"
                    title="Validation is required to export a project"
                    v-if="dialogState.action === 'export'"
                    v-text="'Validate ⓘ'"
                  />
                  <th class="text-center" v-text="'Export'" />
                  <th
                    class="text-center"
                    v-if="dialogState.action === 'export'"
                    v-text="'Include activities'"
                  />
                </tr>
              </thead>
              <tbody
                :key="projectStore.state.numLoaded"
                v-if="dialogState.data.projects.length > 0"
              >
                <tr
                  :key="index"
                  v-for="(project, index) in dialogState.data.projects"
                >
                  <td v-text="project.name" />
                  <td v-text="new Date(project.createdAt).toLocaleString()" />
                  <td
                    v-text="
                      new Date(
                        project.updatedAt
                          ? project.updatedAt
                          : project.createdAt
                      ).toLocaleString()
                    "
                  />
                  <template v-if="dialogState.action === 'delete'">
                    <td class="text-center">
                      <v-checkbox
                        class="my-0 mx-auto"
                        color="project"
                        hide-details
                        v-model="project.state.selected"
                      />
                    </td>
                  </template>

                  <template v-else-if="dialogState.action === 'export'">
                    <td class="text-center">
                      <div v-if="project.doc">
                        <v-btn @click="project.unload()" icon>
                          <v-icon v-text="'mdi-check'" />
                        </v-btn>
                      </div>
                      <v-btn
                        @click="projectStore.loadProject(project)"
                        icon
                        v-else
                      >
                        <v-icon v-text="'mdi-checkbox-blank-outline'" />
                      </v-btn>
                    </td>
                    <td class="text-center">
                      <div v-if="project.doc">
                        <v-checkbox
                          class="my-0 mx-auto"
                          color="project"
                          hide-details
                          v-model="project.state.selected"
                        />
                      </div>
                    </td>
                    <td class="text-center">
                      <div v-if="project.doc">
                        <!-- <v-row> -->
                        <!-- <v-col class="py-4" cols="4">
                        <ActivityGraphIcon :project="project" small />
                      </v-col> -->
                        <!-- <v-col cols="4"> -->
                        <v-checkbox
                          :disabled="!project.state.activities.hasSomeEvents"
                          class="my-0 mx-auto"
                          color="project"
                          hide-details
                          v-model="project.state.withActivities"
                        />
                        <!-- </v-col>
                    </v-row> -->
                      </div>
                    </td>
                  </template>
                </tr>
              </tbody>
              <tbody v-else>
                No projects saved in this browser session were found.
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog" outlined small text v-text="'cancel'" />
          <v-btn
            :disabled="dialogState.data.projects.every(p => p.state.selected)"
            @click="selectAll"
            outlined
            small
            text
            v-text="'select all'"
          />
          <v-btn
            :disabled="!dialogState.data.projects.some(p => p.state.selected)"
            @click="unselectAll"
            outlined
            small
            text
            v-text="'unselect all'"
          />
          <v-btn
            :disabled="!dialogState.data.projects.some(p => p.state.selected)"
            @click="exportProjects"
            outlined
            small
            v-if="dialogState.action === 'export'"
          >
            <v-icon left v-text="'mdi-export'" />
            Export
          </v-btn>
          <v-btn
            :disabled="!dialogState.data.projects.some(p => p.state.selected)"
            @click="deleteProjects"
            outlined
            small
            v-if="dialogState.action === 'delete'"
          >
            <v-icon left v-text="'mdi-trash-can-outline'" />
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { Project } from '@/core/project/project';
import ActivityGraphIcon from '@/components/activity/ActivityGraphIcon.vue';
import core from '@/core';
import ProjectsImportDialog from '@/components/dialog/ProjectsImportDialog.vue';

export default Vue.extend({
  name: 'ProjectsDialog',
  components: {
    ActivityGraphIcon,
    ProjectsImportDialog,
  },
  setup(_, { root }) {
    const dialogState = core.app.state.dialog;

    /**
     * Export selected projects.
     */
    const exportProjects = () => {
      const selectedProjects: Project[] = dialogState.data.projects.filter(
        (project: Project) => project.doc && project.state.selected
      );
      if (selectedProjects.length > 0) {
        core.app.project.exportProjects(selectedProjects);
      }
      core.app.closeDialog();
    };

    /**
     * Delete selected projects.
     */
    const deleteProjects = () => {
      const selectedProjects: string[] = dialogState.data.projects.filter(
        (project: any) => project.state.selected
      );
      core.app.project.deleteProjects(selectedProjects);
      core.app.closeDialog();
    };

    /**
     * Reload the projects from the database.
     */
    const reloadProjects = () => {
      core.app.project.initProjectList().then(() => {
        core.app.project.view.redirect();
      });
      core.app.closeDialog();
    };

    /**
     * Reset project database.
     */
    const resetProjects = () => {
      core.app.project.resetDatabase().then(() => {
        core.app.project.view.redirect();
      });
      core.app.closeDialog();
    };

    /**
     * Selects all projects in the list.
     */
    function selectAll() {
      dialogState.data.projects.forEach((project: Project) => {
        project.state.selected = true;
        console.log('Selected ' + project);
      });
    }

    /**
     * Unselects all projects in the list.
     */
    function unselectAll() {
      dialogState.data.projects.forEach((project: Project) => {
        project.state.selected = false;
        console.log('Unselected ' + project);
      });
    }

    return {
      closeDialog: () => core.app.closeDialog(),
      deleteProjects,
      dialogState,
      exportProjects,
      reloadProjects,
      resetProjects,
      selectAll,
      unselectAll,
      projectStore: core.app.project,
    };
  },
});
</script>

<style>
.v-input__slot {
  align-items: center;
  justify-content: center;
}
</style>
