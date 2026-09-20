function App() {
  let authenticated = false;

  try {
    const session = sessionStorage.getItem("aquaguardSession");

    if (session) {
      const parsed = JSON.parse(session);
      authenticated = parsed?.authenticated === true;
    }
  } catch {
    authenticated = false;
  }

  // Not logged in → open login page
  if (!authenticated) {
    window.location.replace("/login.html");
    return null;
  }

  // Logged in → open dashboard
  return (
    <iframe
      src="/dashboard.html"
      title="AquaGuard AI Dashboard"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        display: "block",
      }}
    />
  );
}

export default App;