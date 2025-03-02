<template>
  <div class="ModelsImportDialog">
    <v-card>
      <v-card-title v-text="'Import models'" />
      <v-card-subtitle v-text="'Select source and file'" />

      <v-card-text>
        <v-row class="mb-1">
          <v-col cols="4">
            <v-select
              :items="state.items"
              dense
              label="Source"
              v-model="state.source"
            >
              <template slot="selection" slot-scope="data">
                <v-icon left v-text="data.item.icon" />
                Import from {{ data.item.text }}
              </template>
              <template slot="item" slot-scope="data">
                <v-icon left v-text="data.item.icon" />
                {{ data.item.text }}
              </template>
            </v-select>
          </v-col>
          <v-col class="pa-3" cols="8">
            <v-row v-show="state.source === 'github'">
              <v-col cols="4">
                <v-select
                  :disabled="state.trees.length === 0"
                  :items="state.trees"
                  @change="getFilesFromGithub"
                  dense
                  label="Element type"
                  prepend-icon="mdi-github"
                  v-model="state.selectedTree"
                />
              </v-col>
              <v-col cols="8">
                <v-select
                  :disabled="state.files.length === 0"
                  :items="state.files"
                  @change="getModelFromGithub"
                  dense
                  label="File"
                  v-model="state.selectedFile"
                />
              </v-col>
            </v-row>
            <v-file-input
              @change="getModelsFromDrive"
              dense
              label="File"
              title="Click to select a file"
              truncate-length="100"
              v-show="state.source === 'drive'"
            />
            <v-text-field
              @change="getModelFromUrl"
              class="ma-0 pa-0"
              clearable
              dense
              flat
              full-width
              label="URL"
              prepend-icon="mdi-web"
              title="Please enter the model's URL"
              v-show="state.source === 'url'"
            />
          </v-col>
        </v-row>

        <span v-if="state.models.length !== 0">
          <span
            v-text="
              `${state.models.length} model${
                state.models.length > 1 ? 's' : ''
              } found. Select models to import:`
            "
          />

          <v-simple-table>
            <thead>
              <tr>
                <th v-text="'Model'" />
                <th v-text="'Label'" />
                <th v-text="'Version'" />
                <th class="text-center" v-text="'Valid'" />
                <th class="text-center" v-text="'Selected'" />
              </tr>
            </thead>
            <tbody>
              <tr :key="index" v-for="(model, index) in state.models">
                <td v-text="model.id" />
                <td v-text="model.label" />
                <td v-text="model.version" />
                <td class="text-center">
                  <v-icon
                    :color="model.valid ? 'green' : 'red'"
                    v-text="model.valid ? 'mdi-check' : 'mdi-cancel'"
                  />
                </td>
                <td class="text-center">
                  <v-checkbox
                    class="ma-0"
                    color="model"
                    hide-details
                    v-model="model.selected"
                  />
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </span>
        <span v-else v-text="'No models found'" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          @click="() => closeDialog()"
          outlined
          small
          text
          v-text="'Cancel'"
        />
        <v-btn
          :disabled="!state.models.some(p => p.selected)"
          @click="importModels"
          outlined
          small
        >
          <v-icon left v-text="'mdi-import'" />
          Import
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { onMounted, reactive } from '@vue/composition-api';
import axios from 'axios';

import { App } from '@/core/app';
import { Model } from '@/core/model/model';
import core from '@/core';

export default Vue.extend({
  name: 'ModelsImportDialog',
  setup() {
    const appState = core.app.state;
    const state = reactive({
      items: [
        {
          icon: 'mdi-paperclip',
          text: 'drive',
          value: 'drive',
        },
        {
          icon: 'mdi-github',
          text: 'GitHub',
          value: 'github',
        },
        {
          icon: 'mdi-web',
          text: 'URL',
          value: 'url',
        },
      ],
      files: [],
      GitHubFile: '',
      modelId: '',
      models: [],
      selectedFile: {},
      selectedTree: {},
      source: '',
      trees: [],
    });

    const app = new App();

    /**
     * Validate model.
     */
    const validateModel = (model: any) => {
      try {
        new Model(app, model);
        model.valid = true;
      } catch {
        model.valid = false;
      }
    };

    /**
     * Fetch models and validate them.
     */
    const fetchModels = (data: any) => {
      const models: any[] = Array.isArray(data) ? data : [data];
      state.models = [];
      models.forEach((model: any) => {
        if (model.id) {
          model.selected = model.id === state.modelId;
          state.models.push(model);
          validateModel(model);
        }
      });
    };

    /**
     * Get model from drive.
     */
    const getModelsFromDrive = (file: any) => {
      const fileReader = new FileReader();
      fileReader.readAsText(file);
      fileReader.addEventListener('load', (event: any) =>
        fetchModels(JSON.parse(event.target.result as string))
      );
    };

    /**
     * Get trees from GitHub.
     */
    const getTreesFromGithub = () => {
      state.selectedFile = {};
      state.trees = [];
      const url =
        'https://api.github.com/repos/nest-desktop/nest-desktop-models/git/trees/main?recursive=true';
      axios.get(url).then((response: any) => {
        state.trees = response.data.tree
          .filter((d: any) => d.type === 'tree')
          .map((d: any) => {
            return {
              text: d.path,
              value: d,
            };
          });

        if (state.GitHubFile) {
          state.selectedTree = state.trees.find((tree: any) =>
            state.GitHubFile.startsWith(tree.text)
          ).value;
          getFilesFromGithub(state.selectedTree);
        }
      });
    };

    /**
     * Get files from GitHub.
     */
    const getFilesFromGithub = (tree: any) => {
      state.files = [];
      const url =
        'https://api.github.com/repos/nest-desktop/nest-desktop-models/git/trees/' +
        tree.sha;
      axios.get(url).then((response: any) => {
        state.files = response.data.tree
          .filter((d: any) => d.type === 'blob' && d.path.endsWith('.json'))
          .map((d: any) => {
            return {
              text: d.path,
              value: d,
            };
          });

        if (state.GitHubFile) {
          state.selectedFile = state.files.find((file: any) =>
            state.GitHubFile.endsWith(file.value.path)
          ).value;
          getModelFromGithub();
        }
      });
    };

    /**
     * Get model from URL.
     */
    const getModelFromUrl = (url: string) => {
      axios.get(url).then((response: any) => fetchModels(response.data));
    };

    /**
     * Get model from GitHub.
     */
    const getModelFromGithub = () => {
      if (!Object.keys(state.selectedTree).includes('path')) {
        return;
      }
      const url = `https://raw.githubusercontent.com/nest-desktop/nest-desktop-models/v3/${state.selectedTree['path']}/${state.selectedFile['path']}`;
      getModelFromUrl(url);
    };

    /**
     * Import selected models.
     */
    const importModels = () => {
      const models: any[] = state.models.filter((model: any) => model.selected);
      core.app.model.importModels(models);
      core.app.closeDialog();
    };

    /**
     * Update model import dialog.
     */
    const update = () => {
      if (appState.dialog != null && appState.dialog.data.models.length === 1) {
        state.source = 'github';
        state.modelId = appState.dialog.data.models[0].id;
        state.GitHubFile = core.app.model.state.filesGithub.find(
          (filename: string) =>
            state.modelId.startsWith(filename.split('.')[0].split('/')[1])
        );
      }

      getTreesFromGithub();
    };

    onMounted(update);

    return {
      closeDialog: () => core.app.closeDialog(),
      getFilesFromGithub,
      getModelFromGithub,
      getModelsFromDrive,
      getModelFromUrl,
      importModels,
      state,
    };
  },
});
</script>
