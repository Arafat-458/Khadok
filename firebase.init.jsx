import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC02kw_lSspdP50eTO_ijeCgxo7qsFA7q0",
  authDomain: "foodie-ecommerce.firebaseapp.com",
  projectId: "foodie-ecommerce",
  storageBucket: "foodie-ecommerce.firebasestorage.app",
  messagingSenderId: "443060023454",
  appId: "1:443060023454:web:1de6194b95e6ffcaa34b8f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export { db };
export default auth;
