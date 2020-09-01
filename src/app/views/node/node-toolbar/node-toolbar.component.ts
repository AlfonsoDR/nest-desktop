import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';

import { Model } from '../../../components/model/model';
import { Node } from '../../../components/node/node';
import { Project } from '../../../components/project/project';

import { AppService } from '../../../services/app/app.service';
import { ModelService } from '../../../services/model/model.service';


@Component({
  selector: 'app-node-toolbar',
  templateUrl: './node-toolbar.component.html',
  styleUrls: ['./node-toolbar.component.scss']
})
export class NodeToolbarComponent implements OnInit {
  @Input() node: Node;
  @Input() disabled: boolean = false;
  public models: Model[] = [];

  @ViewChild(MatMenuTrigger, { static: false }) contextMenu: MatMenuTrigger;
  public contextMenuPosition = { x: '0px', y: '0px' };

  constructor(
    private _appService: AppService,
  ) { }

  ngOnInit() {
    this.models = this.node.models;
  }

  onMouseOver(event: MouseEvent): void {
    this._appService.rightClick = true;
  }

  onMouseOut(event: MouseEvent): void {
    this._appService.rightClick = false;
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.openMenu();
  }

}
