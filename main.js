console.log("main.js FINAL LOADED");

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
    const authEl = document.getElementById("auth");
    const appEl = document.getElementById("app");

    if (!authEl || !appEl) {
      alert("화면 구성(id=auth/app)을 찾을 수 없어. index.html id를 확인해줘!");
      return;
    }

    authEl.style.display = "none";
    appEl.style.display = "block";
    loadFiles();
  } else {
    alert("비밀번호 틀림");
  }
}

// 파일 업로드 (Storage 업로드 + DB 저장)
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput?.files?.[0];

  if (!file) {
    alert("파일을 선택해줘!");
    return;
  }

  // Storage에는 안전한 이름으로 저장
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const storageKey = `uploads/${Date.now()}.${ext}`;

  // 1) Storage 업로드
  const { error: uploadError } = await supabaseClient.storage
    .from("files")
    .upload(storageKey, file, { contentType: file.type });

  if (uploadError) {
    alert("업로드 실패: " + uploadError.message);
    console.error(uploadError);
    return;
  }

  // 2) DB(items)에 원래 파일명 + storageKey 저장
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

// 목록 불러오기 + 다운로드 버튼(원래 이름으로 저장)
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
  if (!list) {
    alert("목록 영역(id=list)을 찾을 수 없어. index.html을 확인해줘!");
    return;
  }

  list.innerHTML = "";

  data.forEach(row => {
    const url =
      "https://dmvthggevvzztdjybgee.supabase.co/storage/v1/object/public/files/" +
      row.storage_key;

    const li = document.createElement("li");

    const name = document.createElement("span");
    name.textContent = row.original_name + " ";

    const btn = document.createElement("button");
    btn.textContent = "다운로드";
    btn.style.marginLeft = "8px";

    btn.onclick = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("다운로드 실패: " + res.status);

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = row.original_name; // ✅ 원래 이름으로 저장 강제
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        alert(String(e.message || e));
        console.error(e);
      }
    };

    li.appendChild(name);
    li.appendChild(btn);
    list.appendChild(li);
  });
}
