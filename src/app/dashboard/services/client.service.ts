import { Client } from './../../interfaces/client.interface';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
// Remove the duplicate import statement for 'Client'
// import { Client } from 'src/app/auth/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private clientsCollection!: AngularFirestoreCollection<Client>;
  clients!: Observable<Client[]>

  constructor(
    private afs: AngularFirestore
  ) {
    this.clientsCollection = this.afs.collection<Client>('clientes');
    this.clients = this.clientsCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data();
        return { ...data, id: a.payload.doc.id } as unknown as Client;
      }))
    );
  }

  getClients() {
    return this.clients;
  }

  getClient(id: string): Observable<Client | undefined> {
    return this.clientsCollection.doc<Client>(id).valueChanges();
  }

  addClient(client: Client) {
    return this.clientsCollection.add(client);
  }

  updateClient(id: string, client: Client) {
    return this.clientsCollection.doc(id).update(client);
  }

  deleteClient(id: string) {
    return this.clientsCollection.doc(id).delete();
  }

}
