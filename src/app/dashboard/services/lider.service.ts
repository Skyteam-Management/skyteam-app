import { Lider } from './../../interfaces/lider.interface';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LiderService {

  private lideresCollection!: AngularFirestoreCollection<Lider>;
  lideres!: Observable<Lider[]>

  constructor(
    private afs: AngularFirestore
  ) {
    this.lideresCollection = this.afs.collection<Lider>('lideres');
    this.lideres = this.lideresCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        return { ...data, id: a.payload.doc.id } as unknown as Lider;
      }))
    );
  }

  getLideres() {
    return this.lideres;
  }

  getLider(id: string): Observable<Lider | undefined> {
    return this.lideresCollection.doc<Lider>(id).valueChanges();
  }

  addLider(lider: Lider) {
    return this.lideresCollection.add(lider);
  }

  updateLider(id: string, lider: Lider) {
    return this.lideresCollection.doc(id).update(lider);
  }

  deleteLider(id: string) {
    return this.lideresCollection.doc(id).delete();
  }

}