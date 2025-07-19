router.post("/verify-risk", async (req, res) => {
  const session = req.body.session;
  const filePath = "./ml/temp_session.csv";
  const csvContent = session
    .map((row) => Object.values(row).join(","))
    .join("\n");
  fs.writeFileSync(filePath, csvContent);

  const { stdout } = await exec("python3 ml/verify.py");
  const result = JSON.parse(stdout);
  res.json(result);
});
