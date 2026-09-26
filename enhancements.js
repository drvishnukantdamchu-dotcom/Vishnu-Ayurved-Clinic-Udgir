// Progressive enhancements for Vishnu Ayurved Clinic appointment + telemedicine flow.
(()=>{
  const CLINIC_PHONE='919518355385';
  const DISPLAY_PHONE='95183 55385';

  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('js-motion');
  }

  // ---------- Existing navigation / gallery / share enhancements ----------
  const menu=document.getElementById('menu'), nav=document.getElementById('navlinks');
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && nav && menu){
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded','false');
    }
  });

  const dialog=document.getElementById('photo-viewer');
  if(dialog){
    document.querySelectorAll('.gallery figure').forEach(figure=>{
      const img=figure.querySelector('img');
      if(!img || img.closest('.photo-button')) return;
      const button=document.createElement('button');
      button.type='button';
      button.className='photo-button';
      button.setAttribute('aria-label','Enlarge: '+img.alt);
      img.before(button);
      button.append(img);
      button.onclick=()=>{
        const dimg=dialog.querySelector('img');
        dimg.src=img.src; dimg.alt=img.alt;
        dialog.querySelector('p').textContent=figure.querySelector('figcaption')?.textContent||'';
        dialog.showModal();
      };
    });
    dialog.querySelector('button')?.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog) dialog.close();});
  }

  const shareBtn=document.getElementById('share-site');
  if(shareBtn){
    shareBtn.onclick=async()=>{
      const url='https://drvishnukantdamchu-dotcom.github.io/Vishnu-Ayurved-Clinic-Udgir/';
      const status=document.getElementById('share-status');
      try{
        if(navigator.share) await navigator.share({title:'Vishnu Ayurved Clinic, Udgir',url});
        else{
          await navigator.clipboard.writeText(url);
          if(status) status.textContent='Website link copied.';
        }
      }catch(e){
        if(e.name!=='AbortError' && status) status.textContent='Share this website: '+url;
      }
    };
  }

  try{ if(typeof setLang==='function') setLang(localStorage.getItem('clinic-language')==='mr'?'mr':'en'); }
  catch(e){ if(typeof setLang==='function') setLang('en'); }

  // ---------- Extra styles ----------
  const style=document.createElement('style');
  style.textContent=`
    .booking-upgrade{margin:26px 0 30px;padding:26px;border:1px solid rgba(213,168,63,.35);border-radius:26px;background:linear-gradient(135deg,#fffdf7,#f1f8f3);box-shadow:0 14px 36px rgba(11,59,39,.07)}
    .booking-upgrade h3{margin:0 0 8px;color:var(--g);font-family:'Cormorant Garamond',serif;font-size:2rem;line-height:1.05}
    .booking-upgrade p{margin:6px 0;color:var(--muted)}
    .booking-badges{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}
    .booking-badge{padding:9px 12px;border-radius:999px;background:#fff;border:1px solid #e6dbc3;font-size:.82rem;font-weight:700;color:var(--g)}
    .booking-badge strong{color:#9d6f18}
    .tele-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;align-items:stretch}
    .tele-box{padding:20px;border-radius:20px;background:linear-gradient(145deg,#0a3a26,#11623c);color:#fff}
    .tele-box h4{font-size:1.08rem;margin:0 0 7px}.tele-box p{color:#dfeae4;font-size:.88rem}.tele-box .btn{margin-top:8px}
    .assist-box{padding:20px;border-radius:20px;background:#fff;border:1px solid #eadfca}
    .assist-box h4{margin:0 0 5px;color:var(--g)}
    .assist-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:13px}
    .assist-actions .btn{padding:12px 8px;font-size:.83rem;text-align:center}
    .assist-note{margin-top:10px;padding:11px 13px;border-radius:12px;background:#fff8e8;color:#6e5b34;font-size:.82rem}
    .slot-guide{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0}
    .slot-guide div{padding:14px 15px;border-radius:15px;background:#fff;border:1px solid #e6dbc3}
    .slot-guide strong{display:block;color:var(--g)}
    .slot-guide small{color:var(--muted)}
    .confirm-note{margin-top:14px;padding:13px 15px;border-radius:14px;background:#edf7f0;border-left:4px solid #1fa956;color:#355746;font-size:.86rem}
    .form .fields label>span{display:block;font-size:.78rem;font-weight:700;color:#44554c;margin:0 0 5px}
    .form .fields select,.form .fields input,.form .fields textarea{min-height:48px}
    .tele-consent{grid-column:1/-1;display:none!important;padding:12px 14px;border:1px solid #e5dcc7;border-radius:14px;background:#fffaf0}
    .tele-consent.show{display:flex!important;gap:10px;align-items:flex-start}
    .tele-consent input{width:auto!important;min-height:auto!important;margin-top:4px}
    .tele-help{grid-column:1/-1;padding:10px 13px;border-radius:12px;background:#f4f8f5;color:#526159;font-size:.8rem}
    .request-summary{display:none;margin:12px 0 0;padding:13px 14px;border-radius:14px;background:#f7fbf8;border:1px solid #dceae1;font-size:.84rem}
    .request-summary.show{display:block}
    .new-schedule{display:grid;gap:10px;margin:20px 0 28px}
    .new-schedule .ls{padding:13px 16px;border-radius:14px;background:#fff;border:1px solid #eadfca;font-size:.9rem}
    .new-schedule .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;background:#22b35e;box-shadow:0 0 0 4px rgba(34,179,94,.16)}
    .low-literacy-banner{position:relative;overflow:hidden}
    .low-literacy-banner:after{content:'☎';position:absolute;right:18px;bottom:-20px;font-size:7rem;opacity:.05;color:var(--g)}
    @media(max-width:800px){.tele-grid{grid-template-columns:1fr}.assist-actions{grid-template-columns:1fr}.slot-guide{grid-template-columns:1fr}.booking-upgrade{padding:20px}}
  `;
  document.head.appendChild(style);

  // ---------- Normalize visible clinic timings ----------
  document.querySelectorAll('.branch').forEach(card=>{
    const title=(card.querySelector('h3')?.textContent||'').toLowerCase();
    const clockRow=[...card.querySelectorAll('.row')].find(r=>r.querySelector('.fa-clock'));
    if(!clockRow) return;
    const span=clockRow.querySelector('span');
    if(!span) return;
    if(title.includes('main') || title.includes('dolphin')){
      span.innerHTML='Morning 7:00–9:00 AM<br>Evening 5:00–9:00 PM';
    }else{
      span.innerHTML='Preferred booking windows: 7:00–9:00 AM & 5:00–9:00 PM<br><small>Flexible visit possible by prior confirmation.</small>';
    }
  });
  document.querySelectorAll('.footer-grid>div').forEach(col=>{
    const h=col.querySelector('h4')?.textContent?.toLowerCase()||'';
    const ps=col.querySelectorAll('p');
    if(h.includes('main') && ps[1]) ps[1].textContent='7–9 AM & 5–9 PM';
    if(h.includes('krantinagar') && ps[1]) ps[1].textContent='Preferred 7–9 AM & 5–9 PM • Flexible by confirmation';
  });

  // Remove older timing widget generated by inline legacy code and replace it with clear request windows.
  document.querySelector('.live-status')?.remove();
  const branchCards=document.querySelector('.branches');
  if(branchCards){
    const schedule=document.createElement('div');
    schedule.className='new-schedule';
    schedule.innerHTML=`
      <div class="ls"><span class="dot"></span><b>Main Branch – Dolphin Statue:</b> booking requests accepted for <b>7:00–9:00 AM</b> or <b>5:00–9:00 PM</b>.</div>
      <div class="ls"><span class="dot"></span><b>Krantinagar / Home Branch:</b> same preferred windows; flexible timing may be offered after doctor confirmation.</div>
    `;
    branchCards.parentNode.insertBefore(schedule,branchCards);
  }

  // ---------- Telemedicine + simple help section ----------
  const contactSection=document.getElementById('contact');
  if(contactSection){
    const container=contactSection.querySelector('.container');
    const contactGrid=contactSection.querySelector('.contact');
    if(container && contactGrid){
      const upgrade=document.createElement('div');
      upgrade.className='booking-upgrade reveal show';
      upgrade.innerHTML=`
        <div class="tele-grid">
          <div class="tele-box">
            <h4>📱 Telemedicine / Online Ayurvedic Consultation</h4>
            <p>Suitable for selected new consultations, follow-up, report review, diet-lifestyle guidance and preliminary Panchakarma suitability discussion. In-person examination may still be advised when clinically necessary.</p>
            <div class="booking-badges"><span class="booking-badge">Morning <strong>7–9 AM</strong></span><span class="booking-badge">Evening <strong>5–9 PM</strong></span></div>
            <button type="button" class="btn btn-gold" id="bookTelemedicine"><i class="fa-solid fa-video"></i> Book Telemedicine</button>
            <p style="font-size:.76rem;margin-top:10px">Not for emergencies. For urgent or severe symptoms, seek the nearest appropriate emergency medical service.</p>
          </div>
          <div class="assist-box low-literacy-banner">
            <h4 class="mr">फॉर्म भरता येत नाही? काही हरकत नाही.</h4>
            <p class="mr">एका बटणावर फोन करा किंवा WhatsApp उघडा. आम्ही अपॉइंटमेंटबद्दल मार्गदर्शन करू.</p>
            <div class="assist-actions">
              <a class="btn btn-green" href="tel:+${CLINIC_PHONE}"><i class="fa-solid fa-phone"></i> 📞 फोन करा</a>
              <a class="btn btn-wa" href="https://wa.me/${CLINIC_PHONE}?text=${encodeURIComponent('नमस्कार डॉक्टर, मला अपॉइंटमेंटबद्दल मदत हवी आहे. कृपया मला मार्गदर्शन करा.') }" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
              <button type="button" class="btn btn-outline" id="listenHelp"><i class="fa-solid fa-volume-high"></i> 🔊 ऐका</button>
            </div>
            <div class="assist-note mr">WhatsApp उघडल्यानंतर तुम्ही लिहिण्याऐवजी <b>voice note</b> देखील पाठवू शकता.</div>
          </div>
        </div>
        <div class="slot-guide">
          <div><strong>🌅 Morning Slot</strong><small>7:00 AM – 9:00 AM • Main / Krantinagar / Telemedicine</small></div>
          <div><strong>🌆 Evening Slot</strong><small>5:00 PM – 9:00 PM • Main / Krantinagar / Telemedicine</small></div>
        </div>
        <div class="confirm-note"><b>Appointment process:</b> Patient sends the request on WhatsApp → Doctor checks branch/date/slot → Doctor replies <b>✅ CONFIRMED</b> or suggests another slot. A requested slot is not treated as confirmed until the clinic replies.</div>
      `;
      container.insertBefore(upgrade,contactGrid);
    }
  }

  // ---------- Rebuild form to remove legacy submit handler ----------
  const oldForm=document.getElementById('appointmentForm');
  if(oldForm){
    const form=oldForm.cloneNode(true);
    oldForm.replaceWith(form);
    const fields=form.querySelector('.fields');

    if(fields){
      // Consultation type and patient type before branch/date fields.
      const branchLabel=form.querySelector('label[for="branch"]');
      branchLabel?.insertAdjacentHTML('beforebegin',`
        <label for="consultType"><span>Consultation type *</span>
          <select id="consultType" required>
            <option value="">Select consultation type *</option>
            <option>Clinic Visit</option>
            <option>Telemedicine / Video Consultation</option>
            <option>Follow-up Consultation</option>
            <option>Panchakarma Consultation</option>
          </select>
        </label>
        <label for="patientType"><span>Patient type *</span>
          <select id="patientType" required>
            <option value="">Select patient type *</option>
            <option>New Patient</option>
            <option>Existing / Follow-up Patient</option>
          </select>
        </label>
      `);

      // Branch options.
      const branch=form.querySelector('#branch');
      if(branch){
        branch.innerHTML=`
          <option value="">Select branch *</option>
          <option value="Main Branch – Dolphin Statue / Shelhal Road">Main Branch – Dolphin Statue / Shelhal Road</option>
          <option value="Krantinagar / Nideban Road (Home Branch)">Krantinagar / Nideban Road (Home Branch)</option>
          <option value="Online / Telemedicine">Online / Telemedicine</option>
        `;
      }

      // Replace free clock-time input with simple two-slot preference.
      const timeLabel=form.querySelector('label[for="time"]');
      if(timeLabel){
        timeLabel.setAttribute('for','slot');
        timeLabel.innerHTML=`<span>Preferred slot *</span>
          <select id="slot" required>
            <option value="">Select slot *</option>
            <option value="Morning 7:00–9:00 AM">🌅 Morning 7:00–9:00 AM</option>
            <option value="Evening 5:00–9:00 PM">🌆 Evening 5:00–9:00 PM</option>
          </select>`;
      }

      // Complaint category + duration before brief complaint text.
      const concernLabel=form.querySelector('label[for="concern"]');
      concernLabel?.insertAdjacentHTML('beforebegin',`
        <label for="concernCategory"><span>Main health concern *</span>
          <select id="concernCategory" required>
            <option value="">Select main concern *</option>
            <option>Joint pain / Arthritis / Stiffness</option>
            <option>Back / Neck pain / Sciatica</option>
            <option>Skin problem</option>
            <option>Hair problem</option>
            <option>Digestive complaint</option>
            <option>Piles / Ano-rectal complaint</option>
            <option>Weight management</option>
            <option>Diabetes / Metabolic health</option>
            <option>BP-related consultation</option>
            <option>Women's health / Menstrual complaint</option>
            <option>PCOS / Preconception / Garbhasanskar</option>
            <option>Fertility consultation</option>
            <option>Male sexual health</option>
            <option>Stress / Sleep / Headache</option>
            <option>Panchakarma consultation</option>
            <option>General Ayurvedic consultation</option>
            <option>Other</option>
          </select>
        </label>
        <label for="duration"><span>Complaint duration</span><input id="duration" type="text" placeholder="e.g. 10 days / 6 months"></label>
      `);
      if(concernLabel){
        const span=concernLabel.querySelector('span');
        if(span) span.textContent='Brief complaint / symptoms';
        const input=concernLabel.querySelector('#concern');
        if(input) input.placeholder='Describe the main problem in 1–2 lines';
      }

      // Telemedicine consent and guidance.
      fields.insertAdjacentHTML('beforeend',`
        <div class="tele-help">📄 If you have previous prescriptions, reports or medicine photos, you can attach them in WhatsApp after sending the booking request.</div>
        <label class="tele-consent" id="teleConsentWrap" for="teleConsent">
          <input id="teleConsent" type="checkbox">
          <span>I consent to an online consultation and understand that the doctor may advise an in-person examination when required.</span>
        </label>
        <div class="request-summary" id="requestSummary"></div>
      `);
    }

    const date=form.querySelector('#date');
    if(date){
      date.required=true;
      date.min=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    }

    const consultType=form.querySelector('#consultType');
    const branch=form.querySelector('#branch');
    const slot=form.querySelector('#slot');
    const consentWrap=form.querySelector('#teleConsentWrap');
    const consent=form.querySelector('#teleConsent');
    const summary=form.querySelector('#requestSummary');

    const updateMode=()=>{
      const tele=consultType?.value==='Telemedicine / Video Consultation';
      if(tele){
        if(branch) branch.value='Online / Telemedicine';
        if(branch) branch.disabled=true;
        consentWrap?.classList.add('show');
        if(consent) consent.required=true;
      }else{
        if(branch) branch.disabled=false;
        consentWrap?.classList.remove('show');
        if(consent){ consent.required=false; consent.checked=false; }
        if(branch?.value==='Online / Telemedicine') branch.value='';
      }
      updateSummary();
    };

    const updateSummary=()=>{
      if(!summary) return;
      const type=consultType?.value||'—';
      const br=branch?.value||'—';
      const sl=slot?.value||'—';
      const dt=date?.value||'—';
      summary.innerHTML=`<b>Request preview:</b> ${type} • ${br} • ${dt} • ${sl}<br><small>Final appointment is confirmed only after clinic reply on WhatsApp.</small>`;
      summary.classList.add('show');
    };

    consultType?.addEventListener('change',updateMode);
    branch?.addEventListener('change',()=>{
      // Home branch can offer an additional flexible option after confirmation.
      const flexible='Flexible timing – Krantinagar/Home Branch (doctor confirmation required)';
      const old=[...slot.options].find(o=>o.value===flexible);
      if(branch.value.includes('Krantinagar')){
        if(!old){ const o=new Option('🏠 Flexible timing – Home Branch (confirm on WhatsApp)',flexible); slot.add(o); }
      }else if(old){ old.remove(); }
      updateSummary();
    });
    [slot,date].forEach(el=>el?.addEventListener('change',updateSummary));

    // Telemedicine CTA auto-fills and scrolls to form.
    document.getElementById('bookTelemedicine')?.addEventListener('click',()=>{
      consultType.value='Telemedicine / Video Consultation';
      updateMode();
      form.scrollIntoView({behavior:'smooth',block:'start'});
      setTimeout(()=>form.querySelector('#name')?.focus(),500);
    });

    // Spoken Marathi help for patients who prefer audio guidance.
    document.getElementById('listenHelp')?.addEventListener('click',()=>{
      const text='अपॉइंटमेंटसाठी फोन करा हे बटण दाबा, किंवा व्हॉट्सअॅप बटण दाबा. सकाळची वेळ सात ते नऊ आणि संध्याकाळची वेळ पाच ते नऊ आहे. घरच्या क्रांतीनगर शाखेसाठी डॉक्टरांच्या पुष्टीनुसार वेळ बदलता येऊ शकते.';
      if('speechSynthesis' in window){
        speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(text); u.lang='mr-IN'; u.rate=.9; speechSynthesis.speak(u);
      }else alert(text);
    });

    const normalizePhone=(raw)=>{
      let p=(raw||'').replace(/\D/g,'');
      if(p.length===10) p='91'+p;
      if(p.startsWith('0') && p.length===11) p='91'+p.slice(1);
      return p;
    };
    const value=id=>form.querySelector('#'+id)?.value?.trim()||'';
    const requestId=()=>{
      const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(new Date()).reduce((a,p)=>(a[p.type]=p.value,a),{});
      return `VAC-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
    };

    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!form.reportValidity()) return;
      const patientPhone=normalizePhone(value('phone'));
      if(patientPhone.length<12){ alert('Please enter a valid 10-digit mobile number.'); return; }

      const id=requestId();
      const finalBranch=(consultType.value==='Telemedicine / Video Consultation')?'Online / Telemedicine':value('branch');
      const patientWa=`https://wa.me/${patientPhone}`;
      const lines=[
        '🟢 NEW APPOINTMENT REQUEST',
        `Request ID: ${id}`,
        '',
        `Consultation: ${value('consultType')}`,
        `Patient type: ${value('patientType')}`,
        `Patient: ${value('name')}`,
        `Mobile: ${value('phone')}`,
        value('age')?`Age: ${value('age')}`:'',
        `Branch / Mode: ${finalBranch}`,
        `Preferred date: ${value('date')}`,
        `Preferred slot: ${value('slot')}`,
        '',
        `Main concern: ${value('concernCategory')}`,
        value('duration')?`Duration: ${value('duration')}`:'',
        value('concern')?`Brief symptoms: ${value('concern')}`:'',
        value('message')?`Additional details: ${value('message')}`:'',
        '',
        '⚠️ SLOT REQUEST — NOT YET CONFIRMED',
        'Doctor, please reply with one of these:',
        `✅ CONFIRMED — ${value('date')} — ${value('slot')} — ${finalBranch}`,
        'OR',
        '❌ NOT AVAILABLE — Please suggest another slot.',
        '',
        `Patient WhatsApp: ${patientWa}`,
        '',
        'Patient: Please wait for clinic confirmation before visiting.'
      ].filter(Boolean);

      window.open(`https://wa.me/${CLINIC_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`,'_blank','noopener');
    },true);
  }
})();