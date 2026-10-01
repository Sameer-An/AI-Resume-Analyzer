// AI Resume Analyzer - Vanilla JavaScript Controller

document.addEventListener('DOMContentLoaded', () => {

  // DOM Elements

  const form = document.getElementById('analyzerForm');

  const fileInput = document.getElementById('resumeFile');

  const dropZone = document.getElementById('dropZone');

  const dropZonePrompt = document.getElementById('dropZonePrompt');

  const filePreview = document.getElementById('filePreview');

  const fileNameEl = document.getElementById('fileName');

  const fileSizeEl = document.getElementById('fileSize');

  const removeFileBtn = document.getElementById('removeFileBtn');

  const jobDescriptionInput = document.getElementById('jobDescription');

  const sampleJdBtn = document.getElementById('sampleJdBtn');

  const submitBtn = document.getElementById('submitBtn');

  const btnSpinner = document.getElementById('btnSpinner');

  const alertBox = document.getElementById('alertBox');

  const alertMessage = document.getElementById('alertMessage');

  const alertClose = document.getElementById('alertClose');

  const resultsPlaceholder = document.getElementById('resultsPlaceholder');

  const loadingCard = document.getElementById('loadingCard');

  const loadingStatus = document.getElementById('loadingStatus');

  const resultsContainer = document.getElementById('resultsContainer');

  const scoreValueEl = document.getElementById('scoreValue');

  const scoreBarFill = document.getElementById('scoreBarFill');

  const scoreSummaryEl = document.getElementById('scoreSummary');

  const aiSummaryEl = document.getElementById('aiSummary');

  const matchedSkillsEl = document.getElementById('matchedSkills');

  const missingSkillsEl = document.getElementById('missingSkills');

  const resumeStrengthsEl = document.getElementById('resumeStrengths');

  const weaknessesEl = document.getElementById('weaknesses');

  const improvementSuggestionsEl = document.getElementById('improvementSuggestions');

  const recommendedSkillsEl = document.getElementById('recommendedSkills');

  const resetBtn = document.getElementById('resetBtn');

  const printBtn = document.getElementById('printBtn');
  const reportResumeName = document.getElementById('reportResumeName');
  const reportAnalyzedAt = document.getElementById('reportAnalyzedAt');
  let reportDetails = null;
  let scoreCounterTimer;
  let titleBeforePrint = null;

  // Sample Job Description for quick testing

  const sampleJobDescription = `Job Title: Junior/Associate Full Stack Developer

Company: TechCorp Solutions

Location: Remote / Hybrid

Key Responsibilities:

- Develop, test, and maintain responsive web applications using HTML, CSS, JavaScript, and Node.js.

- Build RESTful APIs and integrate third-party web services and APIs.

- Collaborate with frontend and backend developers to deliver scalable features.

- Write clean, maintainable, and well-documented code following modern Git workflows.

- Troubleshoot, debug, and optimize application performance and database queries.

Requirements & Qualifications:

- Bachelor's degree in Computer Science, Information Technology, or equivalent practical experience.

- Strong proficiency in JavaScript (ES6+), HTML5, and CSS3.

- Hands-on experience with Node.js and Express.js for backend API development.

- Familiarity with SQL or NoSQL databases.

- Experience with Git version control and GitHub.

- Understanding of responsive design, web standards, and REST principles.

- Bonus: Exposure to Cloud platforms (AWS, GCP), Docker, or AI API integrations.`;

  // 1. File Upload and Drag-and-Drop Handling

  fileInput.addEventListener('change', handleFileSelect);

  ['dragenter', 'dragover'].forEach(eventName => {

    dropZone.addEventListener(eventName, (e) => {

      e.preventDefault();

      e.stopPropagation();

      dropZone.classList.add('dragover');

    });

  });

  ['dragleave', 'drop'].forEach(eventName => {

    dropZone.addEventListener(eventName, (e) => {

      e.preventDefault();

      e.stopPropagation();

      dropZone.classList.remove('dragover');

    });

  });

  dropZone.addEventListener('drop', (e) => {

    const dt = e.dataTransfer;

    const files = dt.files;

    if (files.length > 0) {

      if (files[0].type === 'application/pdf' || files[0].name.toLowerCase().endsWith('.pdf')) {

        fileInput.files = files;

        handleFileSelect();

      } else {

        showAlert('Please upload a PDF document.');

      }

    }

  });

  function handleFileSelect() {

    if (fileInput.files && fileInput.files[0]) {

      const file = fileInput.files[0];

      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {

        showAlert('Only PDF files are supported.');

        resetFileInput();

        return;

      }

      if (file.size > 10 * 1024 * 1024) {

        showAlert('File size exceeds the 10MB limit. Please upload a smaller PDF.');

        resetFileInput();

        return;

      }

      hideAlert();

      fileNameEl.textContent = file.name;

      fileSizeEl.textContent = formatBytes(file.size);

      dropZonePrompt.classList.add('hidden');

      filePreview.classList.remove('hidden');

    }

  }

  function resetFileInput() {

    fileInput.value = '';

    dropZonePrompt.classList.remove('hidden');

    filePreview.classList.add('hidden');

  }

  removeFileBtn.addEventListener('click', (e) => {

    e.stopPropagation();

    resetFileInput();

  });

  // 2. Insert Sample JD

  sampleJdBtn.addEventListener('click', () => {

    jobDescriptionInput.value = sampleJobDescription;

    jobDescriptionInput.focus();

  });

  // 3. Alert Box Management

  function showAlert(msg) {

    alertMessage.textContent = msg;

    alertBox.classList.remove('hidden');

    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  }

  function hideAlert() {

    alertBox.classList.add('hidden');

    alertMessage.textContent = '';

  }

  alertClose.addEventListener('click', hideAlert);

  // 4. Form Submission

  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    hideAlert();

    const file = fileInput.files[0];

    const jobDescription = jobDescriptionInput.value.trim();

    if (!file) {

      showAlert('Please select or drop a PDF resume.');

      return;

    }

    if (!jobDescription || jobDescription.length < 20) {

      showAlert('Please enter a descriptive job description (at least 20 characters).');

      return;

    }

    // Set Loading UI State

    setLoadingState(true);

    const formData = new FormData();

    formData.append('resume', file);

    formData.append('jobDescription', jobDescription);

    try {

      const response = await fetch('/api/analyze', {

        method: 'POST',

        body: formData

      });

      const result = await response.json();

      if (!response.ok) {

        throw new Error(result.error || `Server responded with status ${response.status}`);

      }

      if (result.success && result.data) {

        renderAnalysis(result.data, { resumeName: file.name, analyzedAt: new Date() });

      } else {

        throw new Error('Received unexpected response format from server.');

      }

    } catch (err) {

      showAlert(err.message || 'An error occurred while analyzing the resume. Please try again.');

      setLoadingState(false, true); // revert to placeholder

    }

  });

  // 5. Loading State Helper

  let statusInterval;

  function setLoadingState(isLoading, revertToPlaceholder = false) {

    if (isLoading) {
      reportDetails = null;
      clearInterval(scoreCounterTimer);

      submitBtn.disabled = true;

      btnSpinner.classList.remove('hidden');

      resultsPlaceholder.classList.add('hidden');

      resultsContainer.classList.add('hidden');

      loadingCard.classList.remove('hidden');

      const statuses = [

        'Extracting text from resume PDF...',

        'Comparing candidate experience with requirements...',

        'Evaluating key strengths and missing qualifications...',

        'Synthesizing final score with Gemini AI...'

      ];

      let idx = 0;

      loadingStatus.textContent = statuses[0];

      statusInterval = setInterval(() => {

        idx = (idx + 1) % statuses.length;

        loadingStatus.textContent = statuses[idx];

      }, 2500);

    } else {

      submitBtn.disabled = false;

      btnSpinner.classList.add('hidden');

      clearInterval(statusInterval);

      loadingCard.classList.add('hidden');

      if (revertToPlaceholder) {

        resultsPlaceholder.classList.remove('hidden');

        resultsContainer.classList.add('hidden');

      } else {

        resultsPlaceholder.classList.add('hidden');

        resultsContainer.classList.remove('hidden');

      }

    }

  }

  // 6. Populate Results

  function renderAnalysis(data, details) {

    setLoadingState(false, false);

    // Score & Progress Bar

    const numericScore = Number(data.matchScore);
    const score = Number.isFinite(numericScore)
      ? Math.max(0, Math.min(100, Math.round(numericScore))) : 0;
    // Capture the analyzed file, not a later edit to the upload field.
    reportDetails = { ...details, score };
    reportResumeName.textContent = reportDetails.resumeName;
    reportAnalyzedAt.textContent = reportDetails.analyzedAt.toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short'
    });
    reportAnalyzedAt.dateTime = reportDetails.analyzedAt.toISOString();

    animateCounter(scoreValueEl, score, 1000);

    scoreBarFill.style.width = `${score}%`;

    // Dynamic color based on score

    if (score >= 75) {

      scoreBarFill.style.background = 'linear-gradient(90deg, #16a34a, #22c55e)';

      scoreSummaryEl.textContent = 'Strong Match: The candidate closely aligns with this position.';

      scoreSummaryEl.style.color = 'var(--success)';

    } else if (score >= 50) {

      scoreBarFill.style.background = 'linear-gradient(90deg, #d97706, #f59e0b)';

      scoreSummaryEl.textContent = 'Moderate Match: Good potential, but some key skill gaps exist.';

      scoreSummaryEl.style.color = 'var(--warning)';

    } else {

      scoreBarFill.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';

      scoreSummaryEl.textContent = 'Low Match: Significant gaps between resume and role requirements.';

      scoreSummaryEl.style.color = 'var(--danger)';

    }

    // AI Summary

    aiSummaryEl.textContent = data.aiSummary || 'No summary provided.';

    // Matched Skills

    renderTags(matchedSkillsEl, data.matchedSkills, 'tag-matched', 'No direct skill matches identified.');

    // Missing Skills

    renderTags(missingSkillsEl, data.missingSkills, 'tag-missing', 'No critical missing skills detected.');

    // Resume Strengths

    renderList(resumeStrengthsEl, data.resumeStrengths, 'No explicit strengths listed.');

    // Weaknesses / Gaps

    renderList(weaknessesEl, data.weaknesses, 'No specific weaknesses noted.');

    // Improvement Suggestions

    renderList(improvementSuggestionsEl, data.improvementSuggestions, 'No improvement suggestions provided.');

    // Recommended Skills

    renderTags(recommendedSkillsEl, data.recommendedSkills, 'tag-recommended', 'No specific skill recommendations.');

    // Smooth scroll to results on smaller screens

    if (window.innerWidth <= 992) {

      resultsContainer.scrollIntoView({ behavior: 'smooth' });

    }

  }

  // Helper: Render Pill Tags

  function renderTags(container, items, className, emptyText) {

    container.innerHTML = '';

    if (!items || !Array.isArray(items) || items.length === 0) {

      const emptySpan = document.createElement('span');

      emptySpan.style.color = 'var(--gray-600)';

      emptySpan.style.fontSize = '13px';

      emptySpan.textContent = emptyText;

      container.appendChild(emptySpan);

      return;

    }

    items.forEach(item => {

      const tag = document.createElement('span');

      tag.className = `tag ${className}`;

      tag.textContent = item;

      container.appendChild(tag);

    });

  }

  // Helper: Render Bullet Lists

  function renderList(container, items, emptyText) {

    container.innerHTML = '';

    if (!items || !Array.isArray(items) || items.length === 0) {

      const li = document.createElement('li');

      li.textContent = emptyText;

      container.appendChild(li);

      return;

    }

    items.forEach(item => {

      const li = document.createElement('li');

      li.textContent = item;

      container.appendChild(li);

    });

  }

  // Helper: Number Counter Animation

  function animateCounter(element, target, duration) {
    clearInterval(scoreCounterTimer);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = target;
      return;
    }

    let start = 0;

    const stepTime = 20;

    const steps = duration / stepTime;

    const increment = target / steps;

    scoreCounterTimer = setInterval(() => {

      start += increment;

      if (start >= target) {

        element.textContent = target;

        clearInterval(scoreCounterTimer);

      } else {

        element.textContent = Math.floor(start);

      }

    }, stepTime);

  }

  // Helper: Format Bytes to KB / MB

  function formatBytes(bytes) {

    if (bytes === 0) return '0 Bytes';

    const k = 1024;

    const sizes = ['Bytes', 'KB', 'MB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];

  }

  // Reset Button

  resetBtn.addEventListener('click', () => {
    reportDetails = null;
    clearInterval(scoreCounterTimer);

    resetFileInput();

    jobDescriptionInput.value = '';

    setLoadingState(false, true);

    window.scrollTo({ top: 0, behavior: 'smooth' });

  });

  // Prepare the visible report for either the button or the browser's Ctrl+P.
  function prepareReportForPrint() {
    if (!reportDetails || resultsContainer.classList.contains('hidden')) return false;
    // Print the final score even if the one-second screen animation is still running.
    clearInterval(scoreCounterTimer);
    scoreValueEl.textContent = String(reportDetails.score);
    scoreBarFill.style.width = `${reportDetails.score}%`;
    if (titleBeforePrint === null) titleBeforePrint = document.title;
    const baseName = reportDetails.resumeName.replace(/\.pdf$/i, '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').slice(0, 80) || 'Resume';
    document.title = `${baseName}-Analysis-Report`;
    return true;
  }

  window.addEventListener('beforeprint', prepareReportForPrint);
  window.addEventListener('afterprint', () => {
    if (titleBeforePrint !== null) {
      document.title = titleBeforePrint;
      titleBeforePrint = null;
    }
  });

  printBtn.addEventListener('click', () => {
    if (!prepareReportForPrint()) {
      showAlert('Analyze a resume before printing a report.');
      return;
    }
    // Uses the current data-theme from theme.js. No upload or API request is made.
    window.print();
  });

});
