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
  // ✅ uploads 폴더가 맞는지 확인하려고 일단 루트("")를 봄
  const { data, error } = await supabaseClient.storage
    .from("files")
    .list("", { limit: 100, offset: 0 });

  if (error) {
    alert("불러오기 실패: " + error.message);
    console.error(error);
    return;
  }

  console.log("list root:", data); // 개발자도구 콘솔에서 확인용

  const list = document.getElementById("list");
  list.innerHTML = "";

  // ✅ 루트에서 uploads 폴더를 찾아서 그 안을 다시 list
  const hasUploads = data.some(x => x.name === "uploads" && x.id === null);

  if (!hasUploads) {
    // uploads 폴더가 없으면: 루트에 파일이 올라간 경우
    data
      .filter(x => x.id !== null) // 파일만
      .forEach(file => {
        const url =
          "https://dmvthggevvzztdjybgee.supabase.co/storage/v1/object/public/files/" +
          encodeURIComponent(file.name);

        const a = document.createElement("a");
        a.href = url;
        a.textContent = file.name;
        a.target = "_blank";

        const li = document.createElement("li");
        li.appendChild(a);
        list.appendChild(li);
      });

    return;
  }

  // ✅ uploads 폴더 안의 파일 목록 가져오기
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from("files")
    .list("uploads", { limit: 100, offset: 0 });

  if (uploadError) {
    alert("uploads 폴더 불러오기 실패: " + uploadError.message);
    console.error(uploadError);
    return;
  }

  console.log("list uploads:", uploadData); // 확인용

  uploadData
    .filter(x => x.id !== null) // 파일만
    .forEach(file => {
      const url =
        "https://dmvthggevvzztdjybgee.supabase.co/storage/v1/object/public/files/uploads/" +
        encodeURIComponent(file.name);

      const a = document.createElement("a");
      a.href = url;
      a.textContent = file.name;
      a.target = "_blank";

      const li = document.createElement("li");
      li.appendChild(a);
      list.appendChild(li);
    });
}
