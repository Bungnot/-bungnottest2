form.onsubmit = (e) => {
  e.preventDefault();
  preview.innerHTML = '';
  const file = videoFile.files[0];
  const text = textToRemove.value.trim();
  if (!file || !text) return;

  // แสดง progress bar
  const prog = document.getElementById('uploadProgress');
  prog.style.display = 'block';
  prog.value = 0;

  const formData = new FormData();
  formData.append('videoFile', file);
  formData.append('textToRemove', text);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/jobs/remove_text');
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      prog.value = (event.loaded / event.total) * 100;
    }
  };
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      prog.style.display = 'none';
      if (xhr.status === 202) {
        const { job_id } = JSON.parse(xhr.responseText);
        preview.innerHTML = `ส่งงานเรียบร้อย รหัสงาน: ${job_id} <br>กำลังประมวลผล...`;
        pollJobStatus(job_id);
      } else {
        preview.innerHTML = 'เกิดข้อผิดพลาดขณะส่งงาน';
      }
    }
  };
  xhr.send(formData);
};


function pollJobStatus(jobId) {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/jobs/${jobId}/status`);
    if (res.ok) {
      const { status, download_url } = await res.json();
      if (status === 'completed') {
        clearInterval(interval);
        preview.innerHTML = `
          <h3>วิดีโอที่ลบข้อความแล้ว</h3>
          <video src="${download_url}" controls style="max-width:100%"></video>
          <br><a href="${download_url}" download="video_no_text.mp4">ดาวน์โหลดวิดีโอ</a>
        `;
      } else if (status === 'failed') {
        clearInterval(interval);
        preview.innerHTML = 'ประมวลผลล้มเหลว กรุณาลองใหม่';
      }
      // ถ้า status ยังไม่ใช่ completed/failed ก็รอวนต่อ
    } else {
      clearInterval(interval);
      preview.innerHTML = 'ไม่สามารถเช็คสถานะได้';
    }
  }, 3000); // เช็คทุก 3 วินาที
}

