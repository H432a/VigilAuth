export async function verifyRisk(session: any[]) {
  const res = await fetch("http://<your-backend-ip>:5000/api/verify-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
  });

  const data = await res.json();
  return data; // { riskScore, level }
}
