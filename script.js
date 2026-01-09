document.addEventListener('DOMContentLoaded', () => {
  const maskButton = document.getElementById('mask-btn');
  const projectList = document.getElementById('project-list');

  if (maskButton) {
    maskButton.addEventListener('click', () => {
      maskButton.classList.toggle('is-active');

      const isActive = maskButton.classList.contains('is-active');
      const images = projectList.querySelectorAll('.project-preview-image');

      images.forEach(img => {
        if (isActive) {
          const wrapper = img.parentElement;
          if(wrapper){
            wrapper.classList.add('masked-image');
          }
        } else {
          const wrapper = img.parentElement;
          if(wrapper){
            wrapper.classList.remove('masked-image');
          }
        }
      });

      if (isActive) {
        // Open the share project modal
        const shareModal = document.getElementById('share-project-modal');
        if (shareModal) {
          shareModal.classList.remove('is-hidden');
        }
      }
    });
  }

  // Add logic to close the share modal
  const cancelShareBtn = document.getElementById('cancel-share-btn');
  const shareProjectClose = document.getElementById('share-project-close');
  const shareModal = document.getElementById('share-project-modal');

  function closeModal() {
    if (shareModal) {
      shareModal.classList.add('is-hidden');
    }
  }

  if (cancelShareBtn) {
    cancelShareBtn.addEventListener('click', closeModal);
  }

  if (shareProjectClose) {
    shareProjectClose.addEventListener('click', closeModal);
  }
});