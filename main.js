// Supabase 연결
const supabaseClient = supabase.createClient(
  "https://dmvthggevvzztdjybgee.supabase.co",
  "sb_publishable_nUa2T--NU8mHqCPJyHacOg_R2ElUJmR"
);

// 비밀번호
const PASSWORD = "1234";

// 비밀번호 확인
function checkPassword() {
  const input = document.getElementById("password").value;

  if (input === PASSWORD) {
    document.getElementById("login").style.display = "none";
    document.getElementById("archive").style.display = "block";
    loadFiles();
  } else {
    alert("비밀번호가 틀렸어요!");
  }
}

// 파일 업로드
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("파일을 선택하세요!");
    return;
  }

  const filePath = `uploads/${Date.now()}_${file.name}`;

  const { error } = await supabaseClient.storage
    .from("files")
    .upload(filePath, file);

  if (error) {
    console.error(error);
    alert("업로드 실패");
    return;
  }

  alert("업로드 완료!");
  fileInput.value = "";
  loadFiles();
}

// 파일 목록 불러오기
async function loadFiles() {
  const list = document.getElementById("fileList");
  list.innerHTML = "";

  const { data, error } = await supabaseClient.storage
    .from("files")
    .list("uploads");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(file => {
    const { data: urlData } = supabaseClient.storage
      .from("files")
      .getPublicUrl(`uploads/${file.name}`);

    const a = document.createElement("a");
    a.href = urlData.publicUrl;
    a.textContent = file.name;
    a.target = "_blank";

    const li = document.createElement("li");
    li.appendChild(a);
    list.appendChild(li);
  });
}
