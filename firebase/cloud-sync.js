// Cloud sync module. Firebase client configuration is supplied separately.
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from '../firebase/firebase-config.js';

let app, auth, db, storage;
export function configureFirebase(){
  if(!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) throw new Error('Firebase config missing. Fill firebase/firebase-config.js first.');
  if(!app){ app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app); storage=getStorage(app); }
  return {auth,db,storage};
}
export function firebaseConfigured(){return Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId&&firebaseConfig.appId)}
export function watchAuth(callback){configureFirebase();return onAuthStateChanged(auth,callback)}
export async function login(email,password){configureFirebase();return signInWithEmailAndPassword(auth,email,password)}
export async function logout(){configureFirebase();return signOut(auth)}
async function photoToCloud(profileId,photo,index){
  if(!photo || !photo.startsWith('data:image/')) return photo;
  const path='profilePhotos/'+profileId+'/'+index+'_'+Date.now()+'.jpg';
  const storageRef=ref(storage,path);
  await uploadString(storageRef,photo,'data_url');
  return await getDownloadURL(storageRef);
}
export async function syncProfiles(records){
  configureFirebase();
  if(!auth.currentUser) throw new Error('Please login first.');
  const uid=auth.currentUser.uid;
  const authDoc=await getDoc(doc(db,'authorizedUsers',uid));
  if(!authDoc.exists()||authDoc.data().active!==true) throw new Error('This account/device is not approved by admin.');
  const prepared=[];
  for(const record of records){
    const cloudPhotos=[];
    for(let i=0;i<(record.photos||[]).length;i++) cloudPhotos.push(await photoToCloud(record.shortId||String(record.id),record.photos[i],i));
    const cloudRecord={...record,photos:cloudPhotos,updatedAt:Date.now(),updatedBy:uid};
    await setDoc(doc(db,'profiles',String(record.shortId||record.id)),cloudRecord);
    prepared.push(cloudRecord);
  }
  return prepared;
}
export async function isOwner(){\n  configureFirebase();\n  if(!auth.currentUser) return false;\n  const authDoc=await getDoc(doc(db,'authorizedUsers',auth.currentUser.uid));\n  return authDoc.exists() && authDoc.data().active===true && authDoc.data().owner===true;\n}\nexport async function downloadProfiles(){
  configureFirebase();
  if(!auth.currentUser) throw new Error('Please login first.');
  const uid=auth.currentUser.uid;
  const authDoc=await getDoc(doc(db,'authorizedUsers',uid));
  if(!authDoc.exists()||authDoc.data().active!==true) throw new Error('This account/device is not approved by admin.');
  const snap=await getDocs(collection(db,'profiles'));
  return snap.docs.map(d=>d.data());
}
