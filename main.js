// Supabase 클라이언트 생성
const supabaseClient = supabase.createClient(
  "URL",
  "KEY"
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
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return;

  await supabaseClient.storage
    .from("files")
    .upload(file.name, file);

  fileInput.value = "";
  loadFiles();
}

async function loadFiles() {
  const { data, error } = await supabaseClient.storage
    .from("files")
    .list("");

  if (error) {
    alert("파일 불러오기 실패");
    return;
  }

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(file => {
    const li = document.createElement("li");
    li.textContent = file.name;
    list.appendChild(li);
  });
}
