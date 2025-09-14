    const acc = document.getElementsByClassName("accordion");
    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        const panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }

    function buscar() {
      const input = document.getElementById("searchInput").value.toLowerCase();
      const panels = document.querySelectorAll(".panel, .accordion, .card");
      panels.forEach(el => {
        if (el.innerText.toLowerCase().includes(input)) {
          el.style.display = "";
        } else {
          el.style.display = "none";
        }
      });
    }

    function enviarTicket(e) {
      e.preventDefault();
      alert("✅ Tu ticket fue enviado. Pronto nos pondremos en contacto.");
      document.querySelector("form").reset();
    }
    document.getElementById("searchInput").addEventListener("keyup", function() {
  let filter = this.value.toLowerCase();
  let faqs = document.querySelectorAll("#faqList .faq");
  
  faqs.forEach(faq => {
    let text = faq.textContent.toLowerCase();
    if (text.includes(filter)) {
      faq.style.display = "";
    } else {
      faq.style.display = "none";
    }
  });
});