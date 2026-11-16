/* ==========================================================================
   SEUS VÍDEOS — edite somente este arquivo
   --------------------------------------------------------------------------
   O site tem duas páginas, cada uma com a sua lista:
     gaming       → página principal (index.html)
     talkingHead  → página /talking-head (talking-head/index.html)

   url        → cole o link do vídeo. Aceita:
                YouTube (normal ou Shorts), Vimeo, Google Drive (link
                público), TikTok (link completo: tiktok.com/@usuario/video/...),
                Instagram Reels ou arquivo direto (.mp4 / .webm).
                Se ficar "", o vídeo NÃO aparece no site. Se uma seção
                (Long Form ou Shorts) não tiver nenhum link, ela some
                da página e do menu.

   title      → (opcional) título que aparece embaixo do vídeo.
                Deixe "" para não mostrar nenhum título.

   thumbnail  → (opcional) imagem de capa, ex.: "assets/img/capa-1.jpg"
                (caminho a partir da pasta do site, vale para as duas páginas).
                YouTube, Vimeo e Google Drive geram a capa sozinhos.
   ========================================================================== */

window.PORTFOLIO = {
  /* ===================== PÁGINA GAMING (principal) ===================== */
  gaming: {
    /* LONG FORM — aparecem um embaixo do outro */
    longForm: [
      { url: "https://youtu.be/NBOZDkYk7fM?si=cDXY-Tw39Nuckbeq", title: "", thumbnail: "" },
      { url: "https://youtu.be/uDTmuXUL7VA?si=OyaViVWeW_x9xVt4", title: "", thumbnail: "" },
      { url: "https://youtu.be/pJSOUStRLH4?si=oF6rqv1kr1BbRDKD", title: "", thumbnail: "" },
      { url: "https://youtu.be/Ki_Rww7Dbs0?si=XuC9WImjyIPe06O_", title: "", thumbnail: "" },
      { url: "https://youtu.be/DeZU0CDFkzo?si=hwldvPp_f7p06h0v", title: "", thumbnail: "" }
    ],

    /* SHORTS — aparecem um ao lado do outro */
    shorts: [
      { url: "https://youtu.be/yCyMzcETFFw?si=wy8uywdWhwR_xmM1", title: "", thumbnail: "" },
      { url: "https://youtu.be/63A96L2DqOA?si=u8ra0hRY9EWwThdL", title: "", thumbnail: "" },
      { url: "https://youtu.be/sO1s0sr6k5o?si=sItJrR7egWeFaTNI", title: "", thumbnail: "" }
    ]
  },

  /* ===================== PÁGINA TALKING HEAD (/talking-head) =====================
     Linhas com url "" ficam escondidas: é só colar os links entre as aspas. */
  talkingHead: {
    /* LONG FORM — aparecem um embaixo do outro */
    longForm: [
      { url: "https://youtu.be/dOsABT48i40?si=Jrl-SeR0zOzCeNB_", title: "", thumbnail: "" },
      { url: "", title: "", thumbnail: "" },
      { url: "", title: "", thumbnail: "" }
    ],

    /* SHORTS — aparecem um ao lado do outro */
    shorts: [
      { url: "", title: "", thumbnail: "" },
      { url: "", title: "", thumbnail: "" },
      { url: "", title: "", thumbnail: "" }
    ]
  }
};
