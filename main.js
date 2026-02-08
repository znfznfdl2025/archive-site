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

  // 1) 안전한 저장용 파일명 (숫자.확장자)
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const storageKey = `uploads/${Date.now()}.${ext}`;

  // 2) Storage 업로드
  const { error: uploadError } = await supabaseClient.storage
    .from("files")
    .upload(storageKey, file, { contentType: file.type });

  if (uploadError) {
    alert("업로드 실패: " + uploadError.message);
    console.error(uploadError);
    return;
  }

  // 3) DB(items)에 원래 파일명 + 저장키 저장
  const { error: dbError } = await supabaseClient
    .from("items")
    .insert([{
      type: "file",
      area: "all",
      original_name: file.name,
      storage_key: storageKey,
      order_index: Date.now()
    }]);

  if (dbError) {
    alert("DB 저장 실패: " + dbError.message);
    console.error(dbError);
    return;
  }

  alert("업로드 성공!");
  fileInput.value = "";
  loadFiles();
}

async function loadFiles() {
  const { data, error } = await supabaseClient
    .from("items")
    .select("id, original_name, storage_key, created_at")
    .eq("type", "file")
    .order("order_index", { ascending: true });

  if (error) {
    alert("목록 불러오기 실패: " + error.message);
    console.error(error);
    return;
  }

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(row => {
    const url =
      "https://dmvthggevvzztdjybgee.supabase.co/storage/v1/object/public/files/" +
      row.storage_key;

    const a = document.createElement("a");
a.href = url;
a.textContent = row.original_name;
a.download = row.original_name; // ⭐ 다운로드 이름 지정

    const li = document.createElement("li");
    li.appendChild(a);
    list.appendChild(li);
  });
}
