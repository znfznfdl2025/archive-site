const supabaseClient = supabase.createClient(
  "https://dmvthggevvzztdjybgee.supabase.co",
  "sb_publishable_nUa2T--NU8mHqCPJyHacOg_R2ElUJmR"
);

const PASSWORD = "1234";

function checkPassword() {
  const input = document.getElementById("password").value;

  if (input === PASSWORD) {
    // ✅ 너 원래 HTML id에 맞춤
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

  const safeName =
    Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = "uploads/" + safeName;

  const { error } = await supabaseClient.storage.from("files").upload(filePath, file);

  if (error) {
    alert("업로드 실패: " + error.message);
    console.error(error);
    return;
  }

  alert("업로드 성공!");
  fileInput.value = "";
  loadFiles();
}

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return;

  // ✅ Supabase에서 100% 안전한 파일명 만들기 (한글/공백/특수문자 제거)
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const safeBase = String(Date.now()); // 숫자만 사용
  const filePath = `uploads/${safeBase}.${ext}`;

  const { error } = await supabaseClient.storage
    .from("files")
    .upload(filePath, file, { contentType: file.type });

  if (error) {
    alert("업로드 실패: " + error.message);
    console.error(error);
    return;
  }

  alert("업로드 성공!");
  fileInput.value = "";
  loadFiles();
}
