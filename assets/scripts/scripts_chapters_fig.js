// Get the modal
var modal = document.getElementById('imageModal');
var modalImg = document.getElementById('modalImage');
var span = document.getElementsByClassName('close')[0];

// Get all images with class "clickable-image"
var images = document.getElementsByClassName('clickable-image');

// Add click event to all images
for (var i = 0; i < images.length; i++) {
  images[i].onclick = function () {
    modal.style.display = 'block';
    modalImg.src = this.src;
  };
}

// Close the modal when clicking on <span> (x)
span.onclick = function () {
  modal.style.display = 'none';
};

// Close the modal when clicking outside of the image
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};
