const supabaseClient = supabase.createClient(
  "https://dmvthggevvzztdjybgee.supabase.co",
  "sb_publishable_nUa2T--NU8mHqCPJyHacOg_R2ElUJmR"
);

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
  if (!file) {
    alert("파일을 선택해줘!");
    return;
  }

  // ✅ Supabase에서 100% 안전한 파일명 (숫자.확장자)
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const filePath = `uploads/${Date.now()}.${ext}`;

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

async function loadFiles() {
  const { data, error } = await supabaseClient.storage
    .from("files")
    .list("uploads");

  if (error) {
    alert("불러오기 실패: " + error.message);
    console.error(error);
    return;
  }

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(file => {
    const url =
      "https://dmvthggevvzztdjybgee.supabase.co/storage/v1/object/public/files/uploads/" +
      file.name;

    const a = document.createElement("a");
    a.href = url;
    a.textContent = file.name;
    a.target = "_blank";

    const li = document.createElement("li");
    li.appendChild(a);
    list.appendChild(li);
  });
}
