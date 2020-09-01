import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MdePopoverModule } from '@material-extended/mde';

import { AppPipesModule } from '../../pipes/pipes.module';

import { MaterialModule } from '../material.module';
import { RoutesModule } from '../routes.module';

import { AppFormsModule } from '../forms/forms.module';
import { LogModule } from '../log/log.module';
import { NetworkModule } from '../network/network.module';

import { ProjectNavigationComponent } from './project-navigation.component';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectSelectionComponent } from './project-selection/project-selection.component';


@NgModule({
  declarations: [
    ProjectListComponent,
    ProjectNavigationComponent,
    ProjectSelectionComponent,
  ],
  exports: [
    ProjectListComponent,
    ProjectNavigationComponent,
    ProjectSelectionComponent,
  ],
  imports: [
    AppFormsModule,
    AppPipesModule,
    // RoutesModule,
    BrowserAnimationsModule,
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    LogModule,
    MaterialModule,
    MdePopoverModule,
    NetworkModule,
  ]
})
export class ProjectNavigationModule { }
