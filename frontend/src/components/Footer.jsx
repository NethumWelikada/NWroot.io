// ============================================================
// Footer.jsx
//
// Per the MIT License terms of this project (see /LICENSE),
// this attribution notice should be retained in forks and
// deployments of this application.
// ============================================================

import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="nwroot-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-brand-name">{import.meta.env.VITE_APP_NAME}</span>
            <span className="footer-tagline">Sudo won't fix ignorance.</span>
          </div>

          <div className="footer-credit">
            <div>
              Developed by{" "}
              <a href="https://github.com/NethumWelikada" target="_blank" rel="noopener noreferrer">
                Nethum Welikada
              </a>
            </div>
            <div>Master of Engineering in Internetworking</div>
            <div>Dalhousie University, Halifax, Nova Scotia, Canada</div>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; {currentYear} NWroot.io. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
