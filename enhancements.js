// Vishnu Ayurved Clinic – stable booking, telemedicine and accessibility enhancements
(()=>{
  'use strict';
  const CLINIC_PHONE='919518355385';
  const DOCTOR_IMAGE='images/doctor-restored-20260926.webp';

  function ready(fn){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }

  ready(()=>{
    const doctorImg=document.querySelector('.doctor-frame img');
    if(doctorImg){
      doctorImg.src=DOCTOR_IMAGE;
      doctorImg.removeAttribute('srcset');
      doctorImg.decoding='async';
      doctorImg.loading='eager';
      doctorImg.style.filter='none';
      doctorImg.style.imageRendering='auto';
      doctorImg.style.objectFit='contain';
      doctorImg.style.objectPosition='center bottom';
    }

    const menu=document.getElementById('menu');
    const nav=document.getElementById('navlinks');
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && nav && menu){
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded','false');
      }
    });

    const shareBtn=document.getElementById('share-site');
    if(shareBtn){
      shareBtn.onclick=async()=>{
        const url='https://drvishnukantdamchu-dotcom.github.io/Vishnu-Ayurved-Clinic-Udgir/';
        const status=document.getElementById('share-status');
        try{
          if(navigator.share) await navigator.share({title:'Vishnu Ayurved Clinic, Udgir',url});
          else if(navigator.clipboard){
            await navigator.clipboard.writeText(url);
            if(status) status.textContent='Website link copied.';
          }
        }catch(err){
          if(err && err.name!=='AbortError' && status) status.textContent=url;
        }
      };
    }

    const dialog=document.getElementById('photo-viewer');
    if(dialog){
      document.querySelectorAll('.gallery figure').forEach(figure=>{
        const img=figure.querySelector('img');
        if(!img || img.closest('.photo-button')) return;
        const button=document.createElement('button');
        button.type='button';
        button.className='photo-button';
        button.setAttribute('aria-label','Enlarge: '+(img.alt||'clinic photo'));
        img.before(button);
        button.append(img);
        button.addEventListener('click',()=>{
          const big=dialog.querySelector('img');
          if(big){big.src=img.src;big.alt=img.alt||'';}
          const p=dialog.querySelector('p');
          if(p) p.textContent=figure.querySelector('figcaption')?.textContent||'';
          if(typeof dialog.showModal==='function') dialog.showModal();
        });
      });
      dialog.querySelector('button')?.addEventListener('click',()=>dialog.close());
      dialog.addEventListener('click',e=>{if(e.target===dialog) dialog.close();});
    }

    try{
      if(typeof setLang==='function') setLang(localStorage.getItem('clinic-language')==='mr'?'mr':'en');
    }catch(_){ if(typeof setLang==='function') setLang('en'); }

    const style=document.createElement('style');
    style.textContent=`
      .booking-upgrade{margin:28px 0 30px;padding:24px;border:1px solid rgba(213,168,63,.38);border-radius:24px;background:linear-gradient(135deg,#fffdf7,#eef8f1);box-shadow:0 14px 36px rgba(11,59,39,.08)}
      .tele-grid{display:grid;grid-template-columns:1.08fr .92fr;gap:18px}
      .tele-box,.assist-box{border-radius:20px;padding:20px}
      .tele-box{background:linear-gradient(145deg,#0a3a26,#11623c);color:#fff}
      .tele-box h3,.assist-box h3{margin:0 0 7px;font-size:1.2rem}
      .tele-box p{color:#dfeae4;margin:7px 0;font-size:.9rem}
      .assist-box{background:#fff;border:1px solid #eadfca}
      .assist-box p{margin:6px 0;color:#5c6861;font-size:.9rem}
      .assist-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:14px}
      .assist-actions .btn{min-height:48px;padding:10px 8px;text-align:center}
      .process-note{margin-top:16px;padding:13px 15px;border-radius:14px;background:#edf7f0;border-left:4px solid #1fa956;color:#355746;font-size:.87rem}
      .new-schedule{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0 28px}
      .new-schedule .slot-info{padding:15px 16px;border-radius:16px;background:#fff;border:1px solid #e7dcc6;box-shadow:0 5px 16px rgba(11,59,39,.04)}
      .slot-info strong{display:block;color:var(--g);font-size:.98rem}.slot-info small{color:var(--muted)}
      .form .fields label>span{display:block;font-size:.78rem;font-weight:700;color:#44554c;margin:0 0 5px}
      .form .fields select,.form .fields input,.form .fields textarea{width:100%;min-height:48px}
      .slot-picker{grid-column:1/-1}
      .slot-buttons{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
      .slot-choice{border:2px solid #dfe7e2;background:#fff;border-radius:16px;padding:15px;cursor:pointer;text-align:left;transition:.18s;font:inherit;color:#33443b}
      .slot-choice:hover{border-color:#83af95;transform:translateY(-1px)}
      .slot-choice.active{border-color:#17653f;background:#edf7f0;box-shadow:0 0 0 3px rgba(23,101,63,.10)}
      .slot-choice b{display:block;color:#0b3b27;font-size:1rem}.slot-choice small{color:#68736d}
      .tele-consent{grid-column:1/-1;display:none;padding:12px 14px;border:1px solid #e5dcc7;border-radius:14px;background:#fffaf0;gap:10px;align-items:flex-start}
      .tele-consent.show{display:flex}.tele-consent input{width:auto!important;min-height:auto!important;margin-top:4px}
      .request-summary{grid-column:1/-1;display:none;padding:13px 14px;border-radius:14px;background:#f7fbf8;border:1px solid #dceae1;font-size:.84rem}
      .request-summary.show{display:block}
      .help-line{grid-column:1/-1;padding:10px 13px;border-radius:12px;background:#fff8e8;color:#6c5a34;font-size:.8rem}
      @media(max-width:800px){.tele-grid,.new-schedule,.slot-buttons{grid-template-columns:1fr}.assist-actions{grid-template-columns:1fr}.booking-upgrade{padding:18px}}
    `;
    document.head.appendChild(style);

    document.querySelectorAll('.live-status').forEach(el=>el.remove());
    document.querySelectorAll('.branch').forEach(card=>{
      const title=(card.querySelector('h3')?.textContent||'').toLowerCase();
      const clockRow=[...card.querySelectorAll('.row')].find(r=>r.querySelector('.fa-clock'));
      const span=clockRow?.querySelector('span');
      if(!span) return;
      if(title.includes('krantinagar')){
        span.innerHTML='Preferred: 7:00–9:00 AM & 5:00–9:00 PM<br><small>Other timing may be offered after confirmation.</small>';
      }else{
        span.innerHTML='Morning 7:00–9:00 AM<br>Evening 5:00–9:00 PM';
      }
    });
    document.querySelectorAll('.footer-grid>div').forEach(col=>{
      const h=(col.querySelector('h4')?.textContent||'').toLowerCase();
      const ps=col.querySelectorAll('p');
      if(h.includes('main') && ps[1]) ps[1].textContent='7–9 AM & 5–9 PM';
      if(h.includes('krantinagar') && ps[1]) ps[1].textContent='Preferred 7–9 AM & 5–9 PM • Flexible after confirmation';
    });

    const branches=document.querySelector('.branches');
    if(branches){
      const schedule=document.createElement('div');
      schedule.className='new-schedule';
      schedule.innerHTML=`
        <div class="slot-info"><strong>🌅 Morning booking window</strong><small>7:00 AM – 9:00 AM • Clinic / Home Branch / Telemedicine</small></div>
        <div class="slot-info"><strong>🌆 Evening booking window</strong><small>5:00 PM – 9:00 PM • Clinic / Home Branch / Telemedicine</small></div>`;
      branches.parentNode.insertBefore(schedule,branches);
    }

    const contactSection=document.getElementById('contact');
    if(contactSection){
      const container=contactSection.querySelector('.container');
      const contactGrid=contactSection.querySelector('.contact');
      if(container && contactGrid){
        const upgrade=document.createElement('div');
        upgrade.className='booking-upgrade';upgrade.id='telemedicine';
        upgrade.innerHTML=`
          <div class="tele-grid">
            <section class="tele-box">
              <h3>📱 Telemedicine / Online Ayurvedic Consultation</h3>
              <p>For selected new consultations, follow-up, report review and diet-lifestyle guidance. If an in-person examination is clinically required, the patient will be advised to visit the clinic.</p>
              <a href="#appointmentForm" class="btn btn-gold" id="bookTelemedicine"><i class="fa-solid fa-video"></i> Book Telemedicine / ऑनलाइन सल्ला</a>
              <p style="font-size:.76rem">Not for emergencies or severe acute symptoms.</p>
            </section>
            <section class="assist-box">
              <h3 class="mr">फॉर्म भरता येत नाही?</h3>
              <p class="mr">थेट फोन करा किंवा WhatsApp उघडा. लिहिता येत नसेल तर WhatsApp वर voice note पाठवा.</p>
              <div class="assist-actions">
                <a class="btn btn-green" href="tel:+${CLINIC_PHONE}"><i class="fa-solid fa-phone"></i> फोन करा</a>
                <a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/${CLINIC_PHONE}?text=${encodeURIComponent('नमस्कार डॉक्टर, मला अपॉइंटमेंटसाठी मदत हवी आहे.')} "><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
                <button class="btn btn-outline" type="button" id="listenHelp"><i class="fa-solid fa-volume-high"></i> ऐका</button>
              </div>
            </section>
          </div>
          <div class="process-note"><b>सोपे नियम:</b> वेबसाइटवर स्लॉट निवडा → WhatsApp request पाठवा → डॉक्टर/क्लिनिककडून <b>✅ CONFIRMED</b> किंवा <b>❌ NOT AVAILABLE + alternate slot</b> असा reply येईपर्यंत appointment final समजू नका.</div>`;
        container.insertBefore(upgrade,contactGrid);
      }
    }

    const oldForm=document.getElementById('appointmentForm');
    if(oldForm){
      const form=oldForm.cloneNode(true);
      oldForm.replaceWith(form);
      const fields=form.querySelector('.fields');
      if(fields){
        const branchLabel=form.querySelector('label[for="branch"]');
        branchLabel?.insertAdjacentHTML('beforebegin',`
          <label for="consultType"><span>Consultation type *</span>
            <select id="consultType" required>
              <option value="">Select consultation type *</option>
              <option value="Clinic Visit">Clinic Visit</option>
              <option value="Telemedicine / Video Consultation">Telemedicine / Video Consultation</option>
              <option value="Follow-up Consultation">Follow-up Consultation</option>
              <option value="Panchakarma Consultation">Panchakarma Consultation</option>
            </select>
          </label>
          <label for="patientType"><span>Patient type *</span>
            <select id="patientType" required>
              <option value="">Select patient type *</option>
              <option value="New Patient">New Patient</option>
              <option value="Existing / Follow-up Patient">Existing / Follow-up Patient</option>
            </select>
          </label>`);

        const branch=form.querySelector('#branch');
        if(branch){
          branch.innerHTML=`
            <option value="">Select branch *</option>
            <option value="Main Branch – Dolphin Statue / Shelhal Road">Main Branch – Dolphin Statue / Shelhal Road</option>
            <option value="Krantinagar / Nideban Road (Home Branch)">Krantinagar / Nideban Road (Home Branch)</option>
            <option value="Online / Telemedicine">Online / Telemedicine</option>`;
          branch.required=true;
        }

        const timeLabel=form.querySelector('label[for="time"]');
        if(timeLabel){
          timeLabel.outerHTML=`
            <div class="slot-picker">
              <span style="display:block;font-size:.78rem;font-weight:700;color:#44554c;margin-bottom:5px">Preferred slot *</span>
              <input type="hidden" id="slot" required>
              <div class="slot-buttons" role="group" aria-label="Preferred appointment slot">
                <button type="button" class="slot-choice" data-slot="Morning 7:00–9:00 AM"><b>🌅 Morning</b><small>7:00 AM – 9:00 AM</small></button>
                <button type="button" class="slot-choice" data-slot="Evening 5:00–9:00 PM"><b>🌆 Evening</b><small>5:00 PM – 9:00 PM</small></button>
              </div>
            </div>`;
        }

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
              <option>BP related consultation</option>
              <option>Women's health / Menstrual complaint / PCOS</option>
              <option>Fertility consultation</option>
              <option>Male sexual health</option>
              <option>Stress / Sleep / Headache</option>
              <option>Panchakarma consultation</option>
              <option>General Ayurvedic consultation</option>
              <option>Other</option>
            </select>
          </label>
          <label for="duration"><span>How long has this problem been present?</span>
            <input id="duration" type="text" placeholder="e.g. 3 days / 6 months / 2 years">
          </label>`);

        if(concernLabel){
          const span=concernLabel.querySelector('span');
          const input=concernLabel.querySelector('#concern');
          if(span) span.textContent='Brief symptoms / main complaint';
          if(input) input.placeholder='Write in 1–2 short lines';
        }

        fields.insertAdjacentHTML('beforeend',`
          <label class="tele-consent" id="teleConsentWrap">
            <input type="checkbox" id="teleConsent">
            <span>I consent to teleconsultation and understand that the doctor may advise an in-person examination if clinically necessary.</span>
          </label>
          <div class="help-line">Do not enter highly sensitive medical information here. For emergencies, do not wait for website/WhatsApp confirmation.</div>
          <div class="request-summary" id="requestSummary"></div>`);
      }

      const date=form.querySelector('#date');
      if(date){
        date.required=true;
        try{
          date.min=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
        }catch(_){
          date.min=new Date().toISOString().slice(0,10);
        }
      }

      const consultType=form.querySelector('#consultType');
      const branch=form.querySelector('#branch');
      const slot=form.querySelector('#slot');
      const consentWrap=form.querySelector('#teleConsentWrap');
      const consent=form.querySelector('#teleConsent');
      const summary=form.querySelector('#requestSummary');
      const slotButtons=[...form.querySelectorAll('.slot-choice')];

      function chooseSlot(value){
        if(slot) slot.value=value;
        slotButtons.forEach(btn=>{btn.classList.toggle('active',btn.dataset.slot===value);btn.setAttribute('aria-pressed',String(btn.dataset.slot===value))});
        updateSummary();
      }
      slotButtons.forEach(btn=>btn.addEventListener('click',()=>chooseSlot(btn.dataset.slot||'')));

      function updateMode(){
        const tele=consultType?.value==='Telemedicine / Video Consultation';
        if(branch){
          if(tele){branch.value='Online / Telemedicine';branch.disabled=true;}
          else if(branch.disabled){branch.disabled=false;if(branch.value==='Online / Telemedicine') branch.value='';}
        }
        if(consentWrap) consentWrap.classList.toggle('show',tele);
        if(consent){consent.required=tele;if(!tele) consent.checked=false;}
        updateSummary();
      }

      function updateSummary(){
        if(!summary) return;
        const type=consultType?.value||'Consultation type pending';
        const br=branch?.value||'Branch pending';
        const dt=date?.value||'Date pending';
        const sl=slot?.value||'Slot pending';
        summary.innerHTML=`<b>Request preview:</b> ${type} • ${br} • ${dt} • ${sl}<br><small>This is a request only. Appointment becomes final after clinic confirmation on WhatsApp.</small>`;
        summary.classList.add('show');
      }

      consultType?.addEventListener('change',updateMode);
      branch?.addEventListener('change',()=>{if(branch.value==='Online / Telemedicine' && consultType){consultType.value='Telemedicine / Video Consultation';updateMode()}else updateSummary()});
      date?.addEventListener('change',updateSummary);

      const heroActions=document.querySelector('.hero .actions');if(heroActions&&!document.getElementById('heroTelemedicine')){const link=document.createElement('a');link.id='heroTelemedicine';link.className='btn btn-outline';link.href='#telemedicine';link.textContent='Telemedicine / ऑनलाइन सल्ला';heroActions.append(link)}
      const teleBtn=document.getElementById('bookTelemedicine');
      if(teleBtn){
        teleBtn.addEventListener('click',(event)=>{event.preventDefault();
          if(consultType){
            consultType.value='Telemedicine / Video Consultation';
            updateMode();
          }
          form.scrollIntoView({behavior:'smooth',block:'start'});
          form.querySelector('#name')?.focus({preventScroll:true});if(summary){summary.setAttribute('role','status');summary.textContent='Telemedicine selected / ऑनलाइन सल्ला निवडला आहे. कृपया तारीख, स्लॉट आणि संमती निवडा.';}
        });
      }

      const listen=document.getElementById('listenHelp');
      if(listen){
        listen.addEventListener('click',()=>{
          const text='अपॉइंटमेंटसाठी खालील फॉर्म भरा. फॉर्म भरता येत नसेल तर फोन करा किंवा व्हॉट्सअॅपवर व्हॉइस नोट पाठवा. मॉर्निंग स्लॉट सकाळी सात ते नऊ आणि इव्हनिंग स्लॉट संध्याकाळी पाच ते नऊ आहे.';
          if('speechSynthesis' in window){
            window.speechSynthesis.cancel();
            const u=new SpeechSynthesisUtterance(text);u.lang='mr-IN';u.rate=.9;window.speechSynthesis.speak(u);
          }else alert(text);
        });
      }

      form.addEventListener('submit',e=>{
        e.preventDefault();
        const get=id=>(form.querySelector('#'+id)?.value||'').trim();
        const name=get('name'), phone=get('phone'), age=get('age'), patientType=get('patientType');
        const type=get('consultType'), br=get('branch'), dt=get('date'), sl=get('slot');
        const cat=get('concernCategory'), duration=get('duration'), brief=get('concern'), extra=get('message');

        if(!name || !phone || !patientType || !type || !br || !dt || !sl || !cat){
          alert('Please complete all required fields, including Morning/Evening slot.');
          return;
        }
        if(type==='Telemedicine / Video Consultation' && consent && !consent.checked){
          alert('Please accept telemedicine consent before continuing.');
          consent.focus();return;
        }

        const id='VAC-'+dt.replaceAll('-','').slice(2)+'-'+String(Date.now()).slice(-4);
        const lines=[
          '🩺 *NEW APPOINTMENT REQUEST – Vishnu Ayurved Clinic*',
          `Booking ID: ${id}`,
          '',
          `Patient: ${name}`,
          `Mobile: ${phone}`,
          age?`Age: ${age}`:'',
          `Patient type: ${patientType}`,
          `Consultation: ${type}`,
          `Branch: ${br}`,
          `Date: ${dt}`,
          `Preferred slot: ${sl}`,
          `Main concern: ${cat}`,
          duration?`Duration: ${duration}`:'',
          brief?`Brief symptoms: ${brief}`:'',
          extra?`Additional details: ${extra}`:'',
          '',
          '⏳ *Status: WAITING FOR CLINIC CONFIRMATION*',
          'Doctor/Clinic reply:',
          '✅ YES / CONFIRMED',
          'or',
          '❌ NO / NOT AVAILABLE – please suggest another slot',
          '',
          'Please confirm this appointment. Thank you.'
        ].filter(Boolean);
        const url='https://wa.me/'+CLINIC_PHONE+'?text='+encodeURIComponent(lines.join('\n'));
        window.location.href=url;
      });

      updateMode();
    }
  });
})();
