// Supabase 연결
const supabaseClient = supabase.createClient(
  "https://dmvthggevvzztdjybgee.supabase.co",
  "sb_publishable_nUa2T--NU8mHqCPJyHacOg_R2ElUJmR"
);

// 비밀번호 (임시)
const PASSWORD = "1234";

// 비밀번호 확인
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

// 파일 업로드
async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  const filePath = `uploads/${Date.now()}_${file.name}`;

  const { error } = await supabaseClient.storage
    .from("files")
    .upload(filePath, file);

  if (error) {
    alert("업로드 실패: " + error.message);
    console.error(error);
    return;
  }

  alert("업로드 성공!");
  loadFiles();
}

// 파일 목록 불러오기
async function loadFiles() {
  const { data, error } = await supabaseClient.storage
    .from("files")
    .list("uploads");

  if (error) {
    alert("불러오기 실패: " + error.message);
    return;
  }

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(file => {
    const fileUrl =
      "https://dmvthggevvzztdjybgee.supabase.co/storage/v1/object/public/files/uploads/" +
      file.name;

    const a = document.createElement("a");
    a.href = fileUrl;
    a.textContent = file.name;
    a.target = "_blank";

    const li = document.createElement("li");
    li.appendChild(a);
    list.appendChild(li);
  });
}
