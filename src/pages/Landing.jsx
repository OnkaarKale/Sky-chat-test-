import { useAuth } from "react-oidc-context";

export default function Landing() {
  const auth = useAuth();

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>SkyChat</h1>
      <button onClick={() => auth.signinRedirect()}>Sign In</button>
      <button onClick={() => auth.signinRedirect({ prompt: "signup" })}>
        Sign Up
      </button>
    </div>
  );
}
