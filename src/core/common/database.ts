import * as PouchDB from 'pouchdb/dist/pouchdb';
import * as PouchDBUpsert from 'pouchdb-upsert/dist/pouchdb.upsert';

import { App } from '../app';

export class DatabaseService {
  private _app: App;
  private _db: PouchDB;
  private _options: any;
  private _state: any = {
    ready: false,
    valid: false,
    version: '',
  };
  private _url: string;

  constructor(app: App, url: string, options: any = {}) {
    this._app = app;
    this._url = url;
    this._options = options;
    this._db = new PouchDB(url, options);
    this.getVersion().then((version: string) => {
      this._state.version = version;
    });
    this.checkVersion();
    this._state.ready = true;
  }

  get app(): App {
    return this._app;
  }

  get db(): PouchDB {
    return this._db;
  }

  get state(): any {
    return this._state;
  }

  async destroy(): Promise<any> {
    return this._db.destroy();
  }

  async reset(): Promise<any> {
    return this.destroy().then(() => {
      this._db = new PouchDB(this._url, this._options);
    });
  }

  get isReady(): boolean {
    return this._state.ready;
  }

  get isValid(): boolean {
    return this._state.valid;
  }

  count(): any {
    return this._db
      .allDocs()
      .then((result: any) => result.total_rows)
      .catch((err: any) => err);
  }

  list(sortedBy: string = '', reverse: boolean = false): any {
    return this._db
      .allDocs({ include_docs: true })
      .then((res: any) => {
        const docs: any[] = res.rows.map((row: any) => row.doc);
        if (sortedBy) {
          docs.sort((a: any, b: any) => a[sortedBy].localeCompare(b[sortedBy]));
        }
        if (reverse) {
          docs.reverse();
        }
        return docs;
      })
      .catch((err: any) => err);
  }

  // CRUD - Create, Read, Update, Delete

  create(data: any): any {
    const dataJSON = data.toJSON();
    dataJSON.hash = data.state.hash || undefined;
    dataJSON.version = this._app.state.version;
    dataJSON.createdAt = new Date();
    return this._db
      .post(dataJSON)
      .then((res: any) => {
        data.doc._id = res.id;
        data.doc.hash = data.state.hash;
        if (!data.createdAt) {
          data.createdAt = dataJSON.createdAt;
        }
        data.updatedAt = undefined;
      })
      .catch((err: any) => console.log(err));
  }

  read(id: string, rev: string = null): any {
    const options: any = { rev };
    return this._db
      .get(id, options)
      .then((doc: any) => doc)
      .catch((err: any) => err);
  }

  update(data: any): any {
    return this._db
      .get(data.doc._id)
      .then((doc: any) => {
        data.doc = doc;
        const dataJSON = data.toJSON();
        dataJSON.hash = data.state.hash || undefined;
        dataJSON.version = this._app.state.version;
        dataJSON.updatedAt = new Date();
        const keys: string[] = Object.keys(dataJSON);
        keys
          .filter((key: string) => !key.startsWith('_'))
          .forEach((key: string) => (doc[key] = dataJSON[key]));
        return this._db
          .put(doc)
          .then(() => {
            data.updatedAt = dataJSON.updatedAt;
          })
          .catch((err: any) => console.log(err));
      })
      .catch((err: any) => {
        console.log(err);
        return this.create(data);
      });
  }

  delete(id: string): any {
    return this._db.get(id).then((doc: any) => this._db.remove(doc));
  }

  deleteBulk(ids: string[]): any {
    return this.list().then((docs: any[]) => {
      docs
        .filter((doc: any) => ids.includes(doc._id))
        .forEach((doc: any) => (doc._deleted = true));
      return this._db.bulkDocs(docs);
    });
  }

  revisions(id: string): any {
    return this._db
      .get(id, { revs: true })
      .then((doc: any) =>
        doc._revisions.ids.map(
          (revId: string, idx: number) =>
            doc._revisions.start - idx + '-' + revId
        )
      )
      .catch((err: any) => err);
  }

  // Version

  getVersion(): any {
    return this._db.get('_local/version').then((doc: any) => doc.version);
  }

  setVersion(): any {
    return this._db.put({
      _id: '_local/version',
      version: this._app.state.version,
    });
  }

  checkVersion(): void {
    this.getVersion()
      .then((version: string) => {
        const dbVersion: string[] = version.split('.');
        const appVersion: string[] = this._app.state.version.split('.');
        this._state.valid =
          appVersion[0] === dbVersion[0] && appVersion[1] === dbVersion[1];
      })
      .catch(() => {
        this.setVersion().then(() => this.checkVersion());
      });
  }
}
