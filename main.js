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

async function loadFiles() {
  const { data, error } = await supabaseClient.storage.from("files").list("uploads");

  if (error) {
    alert("불러오기 실패: " + error.message);
    console.error(error);
    return;
  }

  const list = document.getElementById("list"); // ✅ 너 원래 HTML ul id=list
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
