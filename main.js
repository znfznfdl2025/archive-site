const supabase = supabase.createClient(
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY"
);

// 임시 비밀번호
const PASSWORD = "1234";

function checkPassword() {
  const input = document.getElementById("password").value;
  if (input === PASSWORD) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadFiles();
  } else {
    alert("비밀번호 틀림");
  }
}

async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  await supabase.storage
    .from("files")
    .upload(file.name, file);

  loadFiles();
}

async function loadFiles() {
  const { data } = await supabase.storage
    .from("files")
    .list("");

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(file => {
    const li = document.createElement("li");
    li.textContent = file.name;
    list.appendChild(li);
  });
}
