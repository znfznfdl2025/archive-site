console.log("main.js v-folder-dnd loaded");

// ====== 설정 ======
const supabaseClient = supabase.createClient(
  "https://dmvthggevvzztdjybgee.supabase.co",
  "sb_publishable_nUa2T--NU8mHqCPJyHacOg_R2ElUJmR"
);

const PASSWORD_ALL = "1234";        // 전체 입장
const PASSWORD_LEADERS = "1111";    // 학회장단(예시: 바꿔도 됨)
const PASSWORD_FINANCE = "2222";    // 총무(예시: 바꿔도 됨)

// ====== 상태 ======
let unlockedLeaders = false;
let unlockedFinance = false;
let currentParentId = null; // 최상위 폴더

// ====== 입장 ======
function checkPassword() {
  const input = document.getElementById("password").value;

  if (input === PASSWORD_ALL) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    render();
  } else {
    alert("비밀번호 틀림");
  }
}

// ====== 추가 잠금 해제(학회장단/총무) ======
function unlockLeaders() {
  const input = prompt("학회장단 비밀번호를 입력해줘");
  if (input === PASSWORD_LEADERS) {
    unlockedLeaders = true;
    alert("학회장단 자료 잠금 해제 완료!");
    render();
  } else {
    alert("비밀번호 틀림");
  }
}

function unlockFinance() {
  const input = prompt("총무 비밀번호를 입력해줘");
  if (input === PASSWORD_FINANCE) {
    unlockedFinance = true;
    alert("총무 자료 잠금 해제 완료!");
    render();
  } else {
    alert("비밀번호 틀림");
  }
}

// ====== 권한 필터 ======
function canSeeArea(area) {
  if (area === "all") return true;
  if (area === "leaders") return unlockedLeaders;
  if (area === "finance") return unlockedFinance;
  return false;
}

// ====== 업로드 (현재 폴더에 업로드 + DB 저장) ======
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput?.files?.[0];
  if (!file) {
    alert("파일을 선택해줘!");
    return;
  }

  // Storage 안전 이름
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const storageKey = `uploads/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("files")
    .upload(storageKey, file, { contentType: file.type });

  if (uploadError) {
    alert("업로드 실패: " + uploadError.message);
    console.error(uploadError);
    return;
  }

  // area는 사용자가 선택 (기본 all)
  const areaSelect = document.getElementById("areaSelect");
  const area = areaSelect?.value || "all";

  const { error: dbError } = await supabaseClient
    .from("items")
    .insert([{
      type: "file",
      parent_id: currentParentId,     // ✅ 현재 폴더
      area,
      original_name: file.name,
      storage_key: storageKey,
      order_index: Date.now()
    }]);

  if (dbError) {
    alert("DB 저장 실패: " + dbError.message);
    console.error(dbError);
    return;
  }

  fileInput.value = "";
  render();
}

// ====== 폴더 만들기 ======
async function createFolder() {
  const name = prompt("폴더 이름을 입력해줘");
  if (!name) return;

  const areaSelect = document.getElementById("areaSelect");
  const area = areaSelect?.value || "all";

  const { error } = await supabaseClient
    .from("items")
    .insert([{
      type: "folder",
      parent_id: currentParentId,
      area,
      original_name: name,
      storage_key: null,
      order_index: Date.now()
    }]);

  if (error) {
    alert("폴더 생성 실패: " + error.message);
    console.error(error);
    return;
  }

  render();
}

// ====== 삭제 (확인 포함) ======
async function deleteItem(row) {
  const ok = confirm(`정말 삭제할까?\n\n${row.original_name}`);
  if (!ok) return;

  // 폴더면: 내부가 비었는지 확인
  if (row.type === "folder") {
    const { data: children, error: childErr } = await supabaseClient
      .from("items")
      .select("id")
      .eq("parent_id", row.id);

    if (childErr) {
      alert("폴더 검사 실패: " + childErr.message);
      console.error(childErr);
      return;
    }

    if (children.length > 0) {
      alert("폴더 안에 파일/폴더가 있어서 삭제할 수 없어.\n먼저 안의 내용을 지워줘!");
      return;
    }
  }

  // 파일이면 Storage에서도 삭제
  if (row.type === "file" && row.storage_key) {
    const { error: storageErr } = await supabaseClient.storage
      .from("files")
      .remove([row.storage_key]);

    if (storageErr) {
      alert("Storage 삭제 실패: " + storageErr.message);
      console.error(storageErr);
      return;
    }
  }

  // DB 삭제
  const { error: dbErr } = await supabaseClient
    .from("items")
    .delete()
    .eq("id", row.id);

  if (dbErr) {
    alert("DB 삭제 실패: " + dbErr.message);
    console.error(dbErr);
    return;
  }

  render();
}

// ====== 다운로드(원래 이름으로 저장) ======
async function downloadFile(row) {
  const url =
    "https://dmvthggevvzztdjybgee.supabase.co/storage/v1/object/public/files/" +
    row.storage_key;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("다운로드 실패: " + res.status);

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = row.original_name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    alert(String(e.message || e));
    console.error(e);
  }
}

// ====== 화면 렌더 ======
async function render() {
  // 상단 경로 표시
  const pathEl = document.getElementById("path");
  if (pathEl) pathEl.textContent = currentParentId ? `폴더 ID: ${currentParentId}` : "최상위";

  // 현재 폴더의 아이템 불러오기
  let query = supabaseClient
    .from("items")
    .select("id, type, parent_id, area, original_name, storage_key, order_index")
    .order("order_index", { ascending: true });

  if (currentParentId === null) {
    query = query.is("parent_id", null);
  } else {
    query = query.eq("parent_id", currentParentId);
  }

  const { data, error } = await query;

  if (error) {
    alert("목록 불러오기 실패: " + error.message);
    console.error(error);
    return;
  }

  // 권한 필터링
  const visible = data.filter(x => canSeeArea(x.area));

  const list = document.getElementById("list");
  list.innerHTML = "";

  visible.forEach(row => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = String(row.id);

    // 드래그 이벤트
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", li.dataset.id);
    });
    li.addEventListener("dragover", (e) => e.preventDefault());
    li.addEventListener("drop", async (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      const targetId = li.dataset.id;
      if (!draggedId || draggedId === targetId) return;

      await reorder(draggedId, targetId, visible);
    });

    // 아이콘 + 이름
    const label = document.createElement("span");
    label.textContent = (row.type === "folder" ? "📁 " : "📄 ") + row.original_name + " ";
    li.appendChild(label);

    // 폴더: 들어가기 버튼
    if (row.type === "folder") {
      const openBtn = document.createElement("button");
      openBtn.textContent = "열기";
      openBtn.onclick = () => {
        currentParentId = row.id;
        render();
      };
      li.appendChild(openBtn);
    }

    // 파일: 다운로드 버튼
    if (row.type === "file") {
      const downBtn = document.createElement("button");
      downBtn.textContent = "다운로드";
      downBtn.style.marginLeft = "8px";
      downBtn.onclick = () => downloadFile(row);
      li.appendChild(downBtn);
    }

    // 삭제 버튼
    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.style.marginLeft = "8px";
    delBtn.onclick = () => deleteItem(row);
    li.appendChild(delBtn);

    list.appendChild(li);
  });
}

// ====== 드래그 정렬 로직 (DB order_index 업데이트) ======
async function reorder(draggedId, targetId, visible) {
  const dragged = visible.find(x => String(x.id) === String(draggedId));
  const target = visible.find(x => String(x.id) === String(targetId));
  if (!dragged || !target) return;

  // 배열에서 위치 바꾸기
  const arr = [...visible];
  const from = arr.findIndex(x => x.id === dragged.id);
  const to = arr.findIndex(x => x.id === target.id);
  arr.splice(to, 0, arr.splice(from, 1)[0]);

  // order_index를 새로 매기기 (단순하게 10씩 증가)
  const updates = arr.map((item, idx) => ({
    id: item.id,
    order_index: (idx + 1) * 10
  }));

  // DB 업데이트(여러 개를 순서대로 업데이트)
  for (const u of updates) {
    const { error } = await supabaseClient
      .from("items")
      .update({ order_index: u.order_index })
      .eq("id", u.id);

    if (error) {
      alert("정렬 저장 실패: " + error.message);
      console.error(error);
      return;
    }
  }

  render();
}

// ====== 뒤로가기 ======
function goBack() {
  currentParentId = null;
  render();
}
