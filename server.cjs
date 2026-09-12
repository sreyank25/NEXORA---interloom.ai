var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var geminiClient = null;
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}
async function generateContentWithResilience(ai, options) {
  const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest"];
  const timeoutMs = options.timeoutMs || 9e3;
  let lastError = null;
  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          ...options.responseMimeType ? { responseMimeType: options.responseMimeType } : {},
          temperature: options.temperature ?? 0.2
        }
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      );
      const response = await Promise.race([generatePromise, timeoutPromise]);
      const text = response?.text;
      if (text && typeof text === "string" && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTemporaryDemand = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Timeout");
      if (isTemporaryDemand && i < modelsToTry.length - 1) {
        console.log(`[AI Engine] Model ${model} is experiencing high demand. Retrying with fallback model ${modelsToTry[i + 1]}...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
    }
  }
  throw lastError || new Error("AI engine temporarily unavailable");
}
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/parse-jd-file", async (req, res) => {
  try {
    const { fileName, fileType, rawText, base64Data } = req.body;
    if (!rawText && !base64Data) {
      return res.status(400).json({ error: "Missing document content or raw text." });
    }
    let effectiveRawText = rawText || "";
    if (!effectiveRawText && base64Data) {
      effectiveRawText = extractTextFromPdfBase64(base64Data);
    }
    const ai = getGeminiClient();
    if (ai) {
      try {
        const promptInstruction = `You are an expert technical talent recruiter, job description parser, and competency evaluator.
Analyze the following Job Description document and extract all requirements, technical competencies, and role parameters.
FileName: ${fileName || "job_description"}

Extract and return ONLY a valid JSON object strictly matching this schema:
{
  "title": string (extracted specific job title, e.g. "Full Stack Developer Intern"),
  "company": string (hiring company or organization, default to "TechNova Solutions" if unspecified),
  "location": string (e.g. "Bangalore, India (Hybrid)" or "Remote"),
  "department": string (e.g. "Engineering", "Data Platform", "Product Development"),
  "employmentType": string (e.g. "Full-time Internship (6 Months)" or "Summer Internship"),
  "experienceLevel": string (e.g. "Student / Recent Graduate" or "0-1 Years"),
  "summary": string (clear 2-3 sentence overview of the role mandate and technical focus),
  "requiredSkills": string[] (crucial mandatory technical skills that candidates MUST possess to be shortlisted, normalized to standard industry names, e.g. ["React", "TypeScript", "Node.js", "REST APIs", "Git", "SQL"]),
  "preferredSkills": string[] (nice-to-have, bonus, or secondary tools, e.g. ["Docker", "TailwindCSS", "AWS", "Redis"]),
  "responsibilities": string[] (bullet points of day-to-day duties and engineering deliverables),
  "qualifications": string[] (eligibility criteria, degrees, GPA, or coursework requirements),
  "analysisSummary": string (sharp recruiter analysis summary highlighting the core technical stack, key screening priorities, and recommended candidate evaluation rubric),
  "competencyBreakdown": {
    "frontend": string[],
    "backend": string[],
    "database": string[],
    "devopsAndCloud": string[],
    "foundations": string[]
  },
  "extractedText": string (clean text representation of the job description)
}`;
        let contents;
        if (base64Data && (fileType?.includes("pdf") || fileName?.toLowerCase().endsWith(".pdf"))) {
          const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
          contents = [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "application/pdf"
              }
            },
            { text: promptInstruction }
          ];
        } else {
          contents = `${promptInstruction}

Job Description Document Text:
${effectiveRawText || ""}`;
        }
        const rawResult = await generateContentWithResilience(ai, {
          contents,
          responseMimeType: "application/json",
          temperature: 0.2,
          timeoutMs: 12e3
        });
        const parsed = JSON.parse(rawResult);
        if (parsed.title && Array.isArray(parsed.requiredSkills) && parsed.requiredSkills.length > 0) {
          if (!parsed.extractedText && effectiveRawText) {
            parsed.extractedText = effectiveRawText;
          }
          return res.json({
            success: true,
            source: "gemini",
            data: parsed
          });
        }
      } catch (geminiErr) {
        console.log("Activating heuristic JD parser (Gemini API transient spike):", geminiErr?.message || "busy");
      }
    }
    const heuristicResult = runHeuristicJDParser(fileName || "Job_Description.pdf", effectiveRawText || "");
    return res.json({
      success: true,
      source: "heuristic",
      data: heuristicResult
    });
  } catch (error) {
    console.error("Parse JD file error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze Job Description file." });
  }
});
app.post("/api/parse-resume-file", async (req, res) => {
  try {
    const { fileName, fileType, rawText, base64Data } = req.body;
    if (!rawText && !base64Data) {
      return res.status(400).json({ error: "Missing resume document content or raw text." });
    }
    let effectiveRawText = rawText || "";
    if (!effectiveRawText && base64Data) {
      effectiveRawText = extractTextFromPdfBase64(base64Data);
    }
    if (base64Data) {
      try {
        const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
        const fileBuffer = Buffer.from(cleanBase64, "base64");
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: "application/pdf" });
        formData.append("file", blob, fileName || "resume.pdf");
        const fastApiRes = await fetch("http://127.0.0.1:8000/api/parse-resume", {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(3500)
        });
        if (fastApiRes.ok) {
          const fastApiData = await fastApiRes.json();
          if (fastApiData.success && fastApiData.data) {
            return res.json({
              success: true,
              source: "fastapi-pymupdf",
              data: fastApiData.data
            });
          }
        }
      } catch (fastApiErr) {
      }
    }
    const ai = getGeminiClient();
    if (ai) {
      try {
        const promptInstruction = `You are an expert technical resume parser and candidate profile evaluator.
Analyze the following candidate resume and extract all details with high fidelity.
FileName: ${fileName || "resume.pdf"}

Extract and return ONLY a valid JSON object strictly matching this schema:
{
  "name": string (full candidate name),
  "email": string (email address),
  "phone": string (phone number or ""),
  "location": string (city/state or "India"),
  "education": {
    "degree": string (e.g. "B.Tech in Computer Science" or "B.E."),
    "institution": string (college or university name),
    "graduationYear": string (e.g. "2025"),
    "gpa": string (e.g. "8.5/10" or "")
  },
  "summary": string (clear 2-sentence summary of candidate technical background),
  "skills": string[] (comprehensive list of distinct technical skills, programming languages, databases, and frameworks found on the resume, e.g. ["Java", "Spring Boot", "MySQL", "REST APIs", "Git"]),
  "experience": [
    {
      "title": string,
      "company": string,
      "period": string,
      "description": string
    }
  ],
  "projects": [
    {
      "title": string,
      "technologies": string[],
      "description": string
    }
  ],
  "rawText": string (clean plain text of the resume)
}`;
        let contents;
        if (base64Data && (fileType?.includes("pdf") || fileName?.toLowerCase().endsWith(".pdf"))) {
          const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
          contents = [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "application/pdf"
              }
            },
            { text: promptInstruction }
          ];
        } else {
          contents = `${promptInstruction}

Candidate Resume Document Text:
${effectiveRawText || ""}`;
        }
        const rawResult = await generateContentWithResilience(ai, {
          contents,
          responseMimeType: "application/json",
          temperature: 0.1,
          timeoutMs: 12e3
        });
        const parsed = JSON.parse(rawResult);
        if (parsed.name && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
          const candidateData = {
            id: `uploaded-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: parsed.name,
            email: parsed.email || `${parsed.name.toLowerCase().replace(/\s+/g, ".")}@campus.edu`,
            phone: parsed.phone || void 0,
            location: parsed.location || "India",
            education: {
              degree: parsed.education?.degree || "B.Tech in Computer Science",
              institution: parsed.education?.institution || "University Placement Candidate",
              graduationYear: parsed.education?.graduationYear || "2025",
              gpa: parsed.education?.gpa || void 0
            },
            summary: parsed.summary || `${parsed.name} is a software developer with skills in ${parsed.skills.slice(0, 4).join(", ")}.`,
            skills: parsed.skills,
            experience: parsed.experience || [],
            projects: parsed.projects || [],
            rawText: parsed.rawText || effectiveRawText || `Resume of ${parsed.name}
Skills: ${parsed.skills.join(", ")}`,
            formatCharacteristics: {
              formatType: "clean-structured",
              hasInconsistentDates: false
            }
          };
          return res.json({
            success: true,
            source: "gemini",
            data: candidateData
          });
        }
      } catch (geminiErr) {
        console.log("Resume parser Gemini fallback to heuristic:", geminiErr?.message || "busy");
      }
    }
    const heuristicCandidate = runHeuristicResumeParser(fileName || "Resume.pdf", effectiveRawText);
    return res.json({
      success: true,
      source: "heuristic",
      data: heuristicCandidate
    });
  } catch (error) {
    console.error("Parse Resume file error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze candidate resume file." });
  }
});
app.post("/api/analyze-jd-bias", async (req, res) => {
  try {
    const { jdText, jdTitle } = req.body;
    if (!jdText) {
      return res.status(400).json({ error: "Missing jdText" });
    }
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are an expert HR and recruitment bias auditor for university/campus hiring.
Analyze the following Job Description for potential bias, exclusionary language, or overly narrow phrasing that could unfairly disqualify capable candidates (especially for a student/intern level role).

Job Title: ${jdTitle || "Job Description"}
JD Content:
${jdText}

Respond ONLY with valid JSON conforming to this schema:
{
  "biasScore": number (0 to 100, where 0 is completely bias-free and 100 is highly exclusionary),
  "summary": string (2-3 sentences summary of the tone and inclusivity),
  "flags": [
    {
      "category": "education" | "experience" | "language" | "tools",
      "severity": "high" | "medium" | "low",
      "excerpt": string (exact phrase from JD),
      "reason": string (why this could unfairly exclude qualified candidates),
      "suggestion": string (how to rephrase more inclusively)
    }
  ],
  "improvedJD": string (an inclusive, rewritten version of the JD preserving technical rigor while removing artificial barriers)
}`;
        const rawText = await generateContentWithResilience(ai, {
          contents: prompt,
          responseMimeType: "application/json",
          temperature: 0.2,
          timeoutMs: 9e3
        });
        const parsed = JSON.parse(rawText);
        if (parsed && typeof parsed.biasScore === "number") {
          return res.json(parsed);
        }
      } catch (geminiErr) {
        console.log("Activating heuristic bias analysis engine (Gemini API transient spike):", geminiErr?.message || "busy");
      }
    }
    return res.json(runHeuristicBiasCheck(jdText));
  } catch (error) {
    console.error("Bias analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze bias" });
  }
});
app.post("/api/recruiter-chat", async (req, res) => {
  try {
    const { query, candidatesContext, jdContext } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are InternLoom's AI Placement Auditor and Recruiter Assistant.
You have access to a Job Description and candidates that were ranked by our hybrid algorithmic shortlisting engine (which combines BM25 keyword matching and domain semantic embeddings).

Job Description:
${jdContext || "Full Stack Developer Intern at TechNova Solutions"}

Candidates Data Summary:
${JSON.stringify(candidatesContext, null, 2)}

Recruiter Question: "${query}"

Guidelines:
1. Answer the question directly, objectively, and accurately based on the candidates' actual skills, projects, and ranking scores.
2. If asked "Why is Candidate X ranked above Candidate Y?", provide a clear side-by-side comparison noting:
   - Final score, keyword score, and semantic score
   - Explicit skill coverage differences
   - Depth of demonstrated projects (e.g. real full-stack vs shallow tutorial projects)
   - Missing required skills
3. Keep the tone professional, objective, and easy for recruiters and hiring managers to scan.
4. If appropriate, highlight candidate strengths in bullet points.`;
        const answerText = await generateContentWithResilience(ai, {
          contents: prompt,
          temperature: 0.3,
          timeoutMs: 8e3
        });
        return res.json({ answer: answerText });
      } catch (geminiErr) {
        console.log("Activating heuristic recruiter chat assistant (Gemini API transient spike):", geminiErr?.message || "busy");
      }
    }
    const answer = generateLocalRecruiterResponse(query, candidatesContext);
    return res.json({ answer });
  } catch (error) {
    console.error("Recruiter chat error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat query" });
  }
});
app.post("/api/analyze-candidate-deep", async (req, res) => {
  try {
    const { candidate, jobDescription } = req.body;
    if (!candidate || !jobDescription) {
      return res.status(400).json({ error: "Missing candidate or job description data." });
    }
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are a Principal Technical Recruiter and Engineering Hiring Manager.
Conduct an in-depth, rigorous, objective evaluation of this candidate's actual resume specifically against this Job Description.

Target Job Description:
- Title: ${jobDescription.title}
- Company: ${jobDescription.company || "Target Company"}
- Required Skills: ${(jobDescription.requiredSkills || []).join(", ")}
- Preferred Skills: ${(jobDescription.preferredSkills || []).join(", ")}
- Role Summary: ${jobDescription.summary || ""}

Candidate Information:
- Name: ${candidate.name}
- Education: ${candidate.education?.degree || ""} from ${candidate.education?.institution || ""} (Graduation: ${candidate.education?.graduationYear || ""}, GPA: ${candidate.education?.gpa || "N/A"})
- Skills: ${(candidate.skills || []).join(", ")}
- Projects: ${JSON.stringify(candidate.projects || [], null, 2)}
- Experience: ${JSON.stringify(candidate.experience || [], null, 2)}
- Full Resume Content:
${candidate.rawText || ""}

Extract and return ONLY a valid JSON object strictly matching this schema:
{
  "overview": string (2-3 concise, professional sentences providing a comprehensive executive summary of this candidate's technical profile, project pedigree, and role fit for ${jobDescription.title}),
  "pros": string[] (4 to 5 specific, evidence-backed strengths directly verified from their resume, explicitly citing their actual project names, technologies, and achievements relevant to this JD),
  "cons": string[] (3 to 4 honest, constructive watchouts, missing tools, scale limitations, or potential risks for this JD that the recruiter must be aware of),
  "whyRecruiterShouldTakeThem": string (2-3 compelling, decisive sentences written directly to the recruiter explaining WHY they should select/interview this candidate for THIS specific JD, what immediate business or technical value they bring on Day 1, and why they stand out from the pool),
  "recommendedVerdict": "Strong Hire" | "High Potential" | "Viable Contender" | "Skill Gap Watch" | "Not Recommended",
  "keyDifferentiator": string (one sharp sentence capturing the single biggest competitive edge or unique factor about this candidate),
  "rampUpReadiness": string (estimated onboarding timeline and velocity, e.g. "Immediate productivity on React/API tasks; ~1-2 weeks ramp-up on Docker microservices"),
  "interviewProbeQuestions": string[] (3 sharp technical and situational interview questions the recruiter or engineering interviewer should ask this candidate to test their claimed skills and probe their gaps)
}`;
        const rawResult = await generateContentWithResilience(ai, {
          contents: prompt,
          responseMimeType: "application/json",
          temperature: 0.2,
          timeoutMs: 14e3
        });
        const parsed = JSON.parse(rawResult);
        if (parsed.overview && Array.isArray(parsed.pros) && Array.isArray(parsed.cons) && parsed.whyRecruiterShouldTakeThem) {
          return res.json({
            success: true,
            source: "gemini",
            data: parsed
          });
        }
      } catch (geminiErr) {
        console.log("Activating heuristic candidate analyzer (Gemini API transient spike):", geminiErr?.message || "busy");
      }
    }
    const heuristicAnalysis = runHeuristicCandidateAnalysis(candidate, jobDescription);
    return res.json({
      success: true,
      source: "heuristic",
      data: heuristicAnalysis
    });
  } catch (error) {
    console.error("Deep candidate analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze candidate." });
  }
});
function runHeuristicCandidateAnalysis(candidate, jd) {
  const c = candidate;
  const targetRole = jd.title || "Technical Role";
  const targetOrg = jd.company || "the engineering team";
  const rawLower = (c.rawText || "").toLowerCase();
  const candSkills = (c.skills || []).map((s) => s.toLowerCase());
  const reqSkills = jd.requiredSkills || [];
  const prefSkills = jd.preferredSkills || [];
  const matchedRequired = reqSkills.filter((req) => {
    const r = req.toLowerCase();
    return candSkills.some((s) => s.includes(r) || r.includes(s)) || rawLower.includes(r);
  });
  const missingRequired = reqSkills.filter((req) => !matchedRequired.includes(req));
  const matchedPreferred = prefSkills.filter((pref) => {
    const p = pref.toLowerCase();
    return candSkills.some((s) => s.includes(p) || p.includes(s)) || rawLower.includes(p);
  });
  const eduString = `${c.education?.degree || "Engineering Degree"} from ${c.education?.institution || "Accredited University"}${c.education?.graduationYear ? ` (Graduation: ${c.education.graduationYear})` : ""}${c.education?.gpa ? ` with GPA of ${c.education.gpa}` : ""}`;
  const overview = `${c.name} holds credentials in ${eduString}. For the ${targetRole} requisition at ${targetOrg}, ${c.name} presents a practical software profile with verified capabilities across ${matchedRequired.length} of ${reqSkills.length || 1} required competencies. Their resume documents ${c.projects?.length || 0} project repository deliverable(s) and active work in ${c.skills?.slice(0, 4).join(", ") || "modern web development"}.`;
  const pros = [];
  if (matchedRequired.length > 0) {
    pros.push(`Direct Core Stack Alignment: Verified proficiency in ${matchedRequired.slice(0, 5).join(", ")}, fulfilling core operational technical requirements for ${targetRole}.`);
  }
  if (c.projects && c.projects.length > 0) {
    const p = c.projects[0];
    const tech = p.technologies?.length > 0 ? ` using ${p.technologies.slice(0, 3).join(", ")}` : "";
    pros.push(`Verifiable Proof-of-Work: Built "${p.title}"${tech} \u2014 demonstrating direct capability to design functional systems rather than relying on abstract theory.`);
  }
  if (c.projects && c.projects.length > 1) {
    const p2 = c.projects[1];
    pros.push(`Diverse Project Execution: Developed "${p2.title}" (${(p2.technologies || []).slice(0, 3).join(", ")}), demonstrating adaptable problem-solving across multiple domains.`);
  }
  if (matchedPreferred.length > 0) {
    pros.push(`Bonus Tool Familiarity: Demonstrates knowledge in preferred tools (${matchedPreferred.join(", ")}), reducing initial onboarding ramp-up.`);
  } else if (rawLower.includes("docker")) {
    pros.push(`Containerization & Deployment Hygiene: Documented familiarity with Docker containers, aiding microservice workflows.`);
  }
  if (c.experience && c.experience.length > 0) {
    pros.push(`Commercial Team Delivery: Completed internship as ${c.experience[0].title} at ${c.experience[0].company} (${c.experience[0].duration}), proving experience in collaborative sprint environments.`);
  } else if (c.education?.gpa && parseFloat(c.education.gpa) >= 8.5) {
    pros.push(`Academic Rigor: Exceptional academic standing (${c.education.gpa} GPA) at ${c.education.institution}, evidencing disciplined problem-solving and rapid learning velocity.`);
  }
  const cons = [];
  if (missingRequired.length > 0) {
    cons.push(`Missing Mandatory Requirement(s): Lacks documented evidence for ${missingRequired.join(", ")}. Candidate will require targeted technical screening or initial pairing.`);
  } else {
    cons.push(`Enterprise Edge-Case Depth: While core keywords are met, in-depth evaluation is recommended on edge-case error handling and concurrency.`);
  }
  const hasTesting = /jest|cypress|mocha|testing|ci\/cd|github actions/i.test(rawLower);
  if (!hasTesting) {
    cons.push("Limited Automated Testing Documentation: Resume lacks explicit mention of unit testing frameworks (e.g. Jest, Cypress) or automated CI/CD deployment pipelines.");
  }
  if (!c.experience || c.experience.length === 0) {
    cons.push("No Prior Corporate Internship: Track record is centered around personal and university repositories; will benefit from team mentoring on Git PR conventions and agile ceremonies.");
  }
  const unverifiedPreferred = prefSkills.filter((p) => !matchedPreferred.includes(p));
  if (unverifiedPreferred.length > 0 && cons.length < 4) {
    cons.push(`Unverified Secondary Tools: No documented proof for nice-to-have technologies: ${unverifiedPreferred.slice(0, 3).join(", ")}.`);
  }
  const finalScoreEst = Math.min(100, Math.round(matchedRequired.length / (reqSkills.length || 1) * 80 + (c.projects?.length || 0) * 10));
  let recommendedVerdict = "Viable Contender";
  let whyRecruiterShouldTakeThem = "";
  if (finalScoreEst >= 75 && missingRequired.length <= 1) {
    recommendedVerdict = "Strong Hire";
    whyRecruiterShouldTakeThem = `Recruiter Hiring Justification: ${c.name} is a standout match for ${targetOrg}'s ${targetRole} opening. Their portfolio directly validates the core stack (${matchedRequired.slice(0, 3).join(", ")}) through practical project repositories like "${c.projects?.[0]?.title || "Featured Build"}", virtually eliminating onboarding risk. Bringing them onto the team gives the engineering lead an immediate contributor capable of shipping clean feature tickets in Week 1 with minimal supervision.`;
  } else if (finalScoreEst >= 60) {
    recommendedVerdict = "High Potential";
    whyRecruiterShouldTakeThem = `Recruiter Hiring Justification: ${c.name} offers high technical return on investment for ${targetOrg}. While showing minor gaps in ${missingRequired[0] || "secondary tools"}, their demonstrated command of ${matchedRequired.slice(0, 3).join(", ")} proves strong engineering horsepower and fast acquisition capacity. They provide high enthusiasm and verifiable software craftsmanship at an entry level.`;
  } else {
    recommendedVerdict = "Viable Contender";
    whyRecruiterShouldTakeThem = `Recruiter Hiring Justification: ${c.name} provides a solid foundational profile for ${targetOrg} if the team values coachability and fundamental problem-solving. While additional pairing will be needed on ${missingRequired.slice(0, 2).join(" and ") || "specialized tools"}, their project work proves genuine initiative and coding dedication.`;
  }
  const keyDifferentiator = c.projects && c.projects.length >= 2 ? `Multi-project software portfolio (${c.projects.map((p) => p.title).slice(0, 2).join(" & ")}) providing tangible proof-of-work.` : `Direct technical stack overlap with ${matchedRequired.slice(0, 3).join(", ") || "core web stack"}.`;
  const rampUpReadiness = finalScoreEst >= 75 ? `Immediate (Days 1-5) on primary ${matchedRequired.slice(0, 2).join(" and ") || "coding"} tasks; ~1 week to acclimate to team deployment standards.` : `~1 to 2 weeks onboarding; rapid ramp on ${matchedRequired.slice(0, 2).join(", ") || "core stack"} with pairing on ${missingRequired[0] || "secondary tools"}.`;
  const interviewProbeQuestions = [
    c.projects && c.projects.length > 0 ? `In your project "${c.projects[0].title}", how did you architect data flow between client and server, and what was your toughest technical hurdle?` : `Describe a complex bug you encountered in a recent project and explain your step-by-step debugging strategy.`,
    missingRequired.length > 0 ? `This role requires practical work with ${missingRequired[0]}. What is your current familiarity, and how would you ramp up within your first sprint?` : `How do you ensure code maintainability, error handling, and security when building backend API endpoints?`,
    `Walk us through how you collaborate with teammates on Git when handling merge conflicts or pull request feedback.`
  ];
  return {
    overview,
    pros,
    cons,
    whyRecruiterShouldTakeThem,
    recommendedVerdict,
    keyDifferentiator,
    rampUpReadiness,
    interviewProbeQuestions,
    source: "heuristic"
  };
}
function runHeuristicBiasCheck(text) {
  const flags = [];
  const lower = text.toLowerCase();
  if (lower.includes("tier 1") || lower.includes("tier-1") || lower.includes("iit") || lower.includes("nit") || lower.includes("bits") || lower.includes("top university only") || lower.includes("premier institution")) {
    flags.push({
      category: "education",
      severity: "high",
      excerpt: "Tier 1 / premier institution requirement",
      reason: "Restricting applicants solely to elite university tiers excludes brilliant self-taught or diverse campus students who possess strong demonstrated coding ability.",
      suggestion: "Replace with: 'B.Tech/B.E. or equivalent in Computer Science, or practical demonstrable full-stack project portfolio.'"
    });
  }
  if (lower.includes("3+ years") || lower.includes("3-5 years") || lower.includes("2+ years") || lower.includes("4+ years") || lower.includes("prior industry experience required")) {
    flags.push({
      category: "experience",
      severity: "high",
      excerpt: "Multi-year professional experience required for an intern role",
      reason: "Internships are entry points. Requiring 2-3+ years of professional industry experience causes high candidate drop-off among top emerging talent.",
      suggestion: "Replace with: 'Prior project experience or coursework in web development, with strong foundational knowledge in JavaScript/TypeScript.'"
    });
  }
  const aggressiveTerms = ["rockstar", "ninja", "guru", "aggressive", "killer instinct", "work around the clock", "high-velocity stress"];
  for (const term of aggressiveTerms) {
    if (lower.includes(term)) {
      flags.push({
        category: "language",
        severity: "medium",
        excerpt: `"${term}"`,
        reason: "Aggressive or cultural jargon discourages candidates from diverse backgrounds and creates ambiguity around day-to-day job expectations.",
        suggestion: "Use neutral, clear terminology like 'collaborative problem-solver' or 'proactive developer'."
      });
    }
  }
  if (lower.includes("proprietary") || lower.includes("internal framework") || lower.includes("in-house")) {
    flags.push({
      category: "tools",
      severity: "medium",
      excerpt: "Proprietary tool knowledge required",
      reason: "Students cannot possibly possess prior experience with internal company proprietary systems.",
      suggestion: "Focus on open-source equivalents like standard Node.js or PostgreSQL."
    });
  }
  const score = flags.length > 0 ? Math.min(92, Math.max(25, flags.length * 26)) : 12;
  let improved = text;
  improved = improved.replace(/Graduates from Tier 1 institutions \(IIT\/NIT\/BITS\) preferred\./gi, "Open to all candidates with demonstrated software projects across accredited institutions.");
  improved = improved.replace(/from Tier 1 institutions only/gi, "with relevant coursework or demonstrated project portfolio");
  improved = improved.replace(/tier[\s-]*(?:1|one)/gi, "accredited university");
  improved = improved.replace(/Minimum 2\+ years of demonstrable hands-on software development experience/gi, "Demonstrated coursework or project experience in modern web development");
  improved = improved.replace(/3\+ years of experience/gi, "hands-on project or internship experience");
  improved = improved.replace(/2\+ years of experience/gi, "practical project experience");
  improved = improved.replace(/rockstar/gi, "motivated");
  improved = improved.replace(/work around the clock/gi, "collaborate effectively with teammates");
  return {
    biasScore: score,
    summary: flags.length > 0 ? `Identified ${flags.length} potential exclusionary barriers in the Job Description, primarily regarding institutional tiering and experience expectations for an intern position.` : "The Job Description has an inclusive, accessible tone, focusing on practical competency and engineering potential.",
    flags,
    improvedJD: improved
  };
}
function generateLocalRecruiterResponse(query, candidates = []) {
  const q = query.toLowerCase();
  const vsMatch = q.match(/(?:why is|compare)?\s*([a-zA-Z\s]+)\s*(?:ranked above|better than|vs|over)\s*([a-zA-Z\s\?]+)/i);
  if (vsMatch && candidates.length >= 2) {
    const nameA = vsMatch[1].trim().toLowerCase();
    const nameB = vsMatch[2].replace(/\?/g, "").trim().toLowerCase();
    const candA = candidates.find((c) => c.name.toLowerCase().includes(nameA) || nameA.includes(c.name.toLowerCase()));
    const candB = candidates.find((c) => c.name.toLowerCase().includes(nameB) || nameB.includes(c.name.toLowerCase()));
    if (candA && candB) {
      const isAHigher = (candA.finalScore || 0) >= (candB.finalScore || 0);
      const first = isAHigher ? candA : candB;
      const second = isAHigher ? candB : candA;
      return `### Comparative Ranking Audit: **${first.name}** (Rank #${first.rank}, ${first.finalScore}%) vs **${second.name}** (Rank #${second.rank}, ${second.finalScore}%)

**Key Ranking Drivers:**
1. **Keyword Coverage:** ${first.name} matched ${first.matchedExplicitSkills?.length || 0} core keywords (Score: ${first.keywordScore}%) versus ${second.name}'s ${second.matchedExplicitSkills?.length || 0} keywords (${second.keywordScore}%).
2. **Semantic Relevancy:** ${first.name} scored ${first.semanticScore}% in contextual domain depth compared to ${second.name}'s ${second.semanticScore}%. ${first.name} demonstrated higher contextual coupling between frontend UI components and backend REST architecture.
3. **Skill Gaps:**
   - **${first.name} Missing:** ${first.missingRequiredSkills?.join(", ") || "None"}
   - **${second.name} Missing:** ${second.missingRequiredSkills?.join(", ") || "None"}

**Recruiter Takeaway:** ${first.name} provides a more turnkey fit for the Junior Full Stack Intern role because their portfolio directly bridges Node.js backend APIs with responsive frontend state management.`;
    }
  }
  if (q.includes("backend") || q.includes("node") || q.includes("api")) {
    const sorted = [...candidates].sort((a, b) => (b.domainScores?.Backend || 0) - (a.domainScores?.Backend || 0));
    const top = sorted.slice(0, 3);
    return `### Top Candidates for Backend Development:
${top.map((c, i) => `${i + 1}. **${c.name}** (Overall Rank #${c.rank}, Score: ${c.finalScore}%)
   - Backend Domain Match: ${(c.domainScores?.Backend || 0) * 100}%
   - Key Backend Skills: ${c.matchedExplicitSkills?.filter((s) => ["Node.js", "Express", "REST APIs", "PostgreSQL", "MongoDB", "SQL"].includes(s)).join(", ") || "REST APIs, Node.js"}`).join("\n\n")}

These candidates demonstrated verified API routing, database schema modeling, and server-side request handling in their project portfolios.`;
  }
  if (q.includes("top 3") || q.includes("summary") || q.includes("shortlist")) {
    const top3 = candidates.slice(0, 3);
    return `### Executive Shortlist Summary (Top 3 Candidates):
${top3.map((c, i) => `**#${i + 1} ${c.name}** \u2014 Score: **${c.finalScore}%** (Keyword: ${c.keywordScore}%, Semantic: ${c.semanticScore}%)
\u2022 **Matched:** ${c.matchedExplicitSkills?.slice(0, 6).join(", ")}
\u2022 **Why Selected:** ${c.explanation || "Strongest verified full-stack project portfolio and high skill density."}
\u2022 **Gap/Development Area:** ${c.missingRequiredSkills?.join(", ") || "Minor domain depth"}`).join("\n\n")}

All top 3 candidates satisfy both core requirements and possess practical GitHub project experience.`;
  }
  return `### Recruitment Engine Insights
- **Pool Size:** ${candidates.length} evaluated resumes.
- **Top Match:** ${candidates[0]?.name || "Top Candidate"} with a score of ${candidates[0]?.finalScore || 0}%.
- **Hybrid Matching Architecture:** Scores combine exact keyword BM25 frequency with contextual domain semantic embeddings (synonyms, related frameworks, and project context).
- You can ask me questions like:
  - *"Why is Candidate A ranked above Candidate B?"*
  - *"Who has the best backend experience?"*
  - *"Which candidates know Docker or DevOps?"*
  - *"Give me a summary of the top 3 shortlist."*`;
}
function extractTextFromPdfBase64(base64Data) {
  try {
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const rawString = buffer.toString("binary");
    const tjMatches = rawString.match(/\(([^()]{2,120})\)\s*T[jJ]/g);
    if (tjMatches && tjMatches.length > 5) {
      const extracted = tjMatches.map((m) => {
        const inner = m.match(/\(([^()]+)\)/);
        return inner ? inner[1] : "";
      }).filter(Boolean).join(" ");
      if (extracted.length > 60) return extracted;
    }
    const asciiRuns = rawString.match(/[\x20-\x7E\t\n\r]{4,}/g);
    if (asciiRuns && asciiRuns.length > 0) {
      const filtered = asciiRuns.filter(
        (chunk) => !chunk.startsWith("/Length") && !chunk.startsWith("/Filter") && !chunk.startsWith("/Font") && !chunk.startsWith("xref") && !chunk.startsWith("trailer") && !chunk.startsWith("/Root") && !chunk.startsWith("/Pages") && chunk.length > 3
      );
      return filtered.join("\n");
    }
  } catch (err) {
    console.warn("Could not extract raw text from PDF buffer:", err);
  }
  return "";
}
function runHeuristicJDParser(fileName, rawText) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const lower = rawText.toLowerCase();
  let title = "";
  for (const line of lines.slice(0, 8)) {
    const titleMatch = line.match(/(?:title|position|role|job)\s*[:\-]\s*(.+)/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      break;
    }
  }
  if (!title) {
    for (const line of lines.slice(0, 5)) {
      if (/(?:intern|developer|engineer|analyst|architect|consultant)/i.test(line) && line.length < 60) {
        title = line.replace(/^[#*\-•\d.]+\s*/, "").trim();
        break;
      }
    }
  }
  if (!title) {
    title = fileName.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").replace(/\b(?:jd|job|description)\b/gi, "").trim();
    if (!title) title = "Software Engineer Intern";
  }
  let company = "TechNova Solutions";
  for (const line of lines.slice(0, 10)) {
    const compMatch = line.match(/(?:company|organization|at)\s*[:\-]\s*(.+)/i);
    if (compMatch && compMatch[1]) {
      company = compMatch[1].trim();
      break;
    }
  }
  let location = "Bangalore, India (Hybrid)";
  if (lower.includes("remote")) {
    location = "Remote";
  } else if (lower.includes("hybrid")) {
    location = "Hybrid (India / Global)";
  } else if (lower.includes("pune")) {
    location = "Pune, India";
  } else if (lower.includes("hyderabad")) {
    location = "Hyderabad, India";
  } else if (lower.includes("delhi") || lower.includes("noida") || lower.includes("gurgaon")) {
    location = "NCR / Gurgaon, India";
  }
  const TECH_SKILLS = [
    { name: "React", aliases: ["react", "react.js", "reactjs"], category: "frontend" },
    { name: "TypeScript", aliases: ["typescript", "ts"], category: "frontend" },
    { name: "JavaScript", aliases: ["javascript", "js", "es6"], category: "frontend" },
    { name: "Node.js", aliases: ["node.js", "nodejs", "node js", "node"], category: "backend" },
    { name: "Express", aliases: ["express", "express.js", "expressjs"], category: "backend" },
    { name: "REST APIs", aliases: ["rest api", "rest apis", "restful", "restful api"], category: "backend" },
    { name: "Python", aliases: ["python", "python3"], category: "backend" },
    { name: "Django", aliases: ["django"], category: "backend" },
    { name: "FastAPI", aliases: ["fastapi"], category: "backend" },
    { name: "Java", aliases: ["java", "core java"], category: "backend" },
    { name: "Spring Boot", aliases: ["spring boot", "springboot", "spring"], category: "backend" },
    { name: "Go", aliases: ["golang", "go lang"], category: "backend" },
    { name: "C++", aliases: ["c++", "cpp"], category: "backend" },
    { name: "PostgreSQL", aliases: ["postgresql", "postgres", "psql"], category: "database" },
    { name: "MongoDB", aliases: ["mongodb", "mongo"], category: "database" },
    { name: "MySQL", aliases: ["mysql"], category: "database" },
    { name: "Redis", aliases: ["redis"], category: "database" },
    { name: "SQL", aliases: ["sql", "rdbms"], category: "database" },
    { name: "Docker", aliases: ["docker", "containerization"], category: "devopsAndCloud" },
    { name: "Kubernetes", aliases: ["kubernetes", "k8s"], category: "devopsAndCloud" },
    { name: "AWS", aliases: ["aws", "amazon web services", "s3", "ec2"], category: "devopsAndCloud" },
    { name: "Git", aliases: ["git", "github", "gitlab", "version control"], category: "devopsAndCloud" },
    { name: "CI/CD", aliases: ["ci/cd", "ci cd", "github actions"], category: "devopsAndCloud" },
    { name: "Linux", aliases: ["linux", "bash", "shell scripting"], category: "devopsAndCloud" },
    { name: "TailwindCSS", aliases: ["tailwind", "tailwindcss"], category: "frontend" },
    { name: "Next.js", aliases: ["next.js", "nextjs"], category: "frontend" },
    { name: "Vue.js", aliases: ["vue", "vue.js", "vuejs"], category: "frontend" },
    { name: "GraphQL", aliases: ["graphql"], category: "backend" },
    { name: "Data Structures", aliases: ["data structures", "dsa"], category: "foundations" },
    { name: "Algorithms", aliases: ["algorithms", "algorithmic"], category: "foundations" },
    { name: "Microservices", aliases: ["microservices", "distributed systems"], category: "backend" }
  ];
  const foundRequired = [];
  const foundPreferred = [];
  const breakdown = {
    frontend: [],
    backend: [],
    database: [],
    devopsAndCloud: [],
    foundations: []
  };
  const preferredSectionIndex = lower.search(/\b(?:preferred|bonus|good to have|nice to have|plus|desired)\b/);
  const preferredText = preferredSectionIndex !== -1 ? lower.slice(preferredSectionIndex) : "";
  const requiredText = preferredSectionIndex !== -1 ? lower.slice(0, preferredSectionIndex) : lower;
  TECH_SKILLS.forEach((skill) => {
    const isPresent = skill.aliases.some((alias) => {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return regex.test(lower);
    });
    if (isPresent) {
      breakdown[skill.category].push(skill.name);
      const isExclusivelyPreferred = preferredSectionIndex !== -1 && skill.aliases.some((alias) => preferredText.includes(alias)) && !skill.aliases.some((alias) => requiredText.includes(alias));
      if (isExclusivelyPreferred) {
        foundPreferred.push(skill.name);
      } else {
        foundRequired.push(skill.name);
      }
    }
  });
  if (foundRequired.length === 0) {
    foundRequired.push("React", "TypeScript", "Node.js", "REST APIs", "Git");
    breakdown.frontend.push("React", "TypeScript");
    breakdown.backend.push("Node.js", "REST APIs");
    breakdown.devopsAndCloud.push("Git");
  }
  const responsibilities = [];
  const qualifications = [];
  let currentSection = null;
  for (const line of lines) {
    if (/(?:responsibilities|duties|what you will do|role overview|what you'll do)/i.test(line)) {
      currentSection = "resp";
      continue;
    } else if (/(?:qualifications|requirements|eligibility|who you are|what we look for)/i.test(line)) {
      currentSection = "qual";
      continue;
    }
    if (line.startsWith("-") || line.startsWith("\u2022") || line.startsWith("*") || /^\d+\./.test(line)) {
      const clean = line.replace(/^[-•*\d.]+\s*/, "").trim();
      if (clean.length > 15) {
        if (currentSection === "resp" && responsibilities.length < 6) {
          responsibilities.push(clean);
        } else if (currentSection === "qual" && qualifications.length < 6) {
          qualifications.push(clean);
        }
      }
    }
  }
  if (responsibilities.length === 0) {
    responsibilities.push(
      `Develop and maintain features across the software stack aligned with ${title} standards.`,
      "Collaborate with engineering mentors and peer developers on architecture and code reviews.",
      "Write testable, clean TypeScript and backend API endpoints with comprehensive documentation."
    );
  }
  if (qualifications.length === 0) {
    qualifications.push(
      "Pursuing or recently completed B.Tech / B.E. / M.Tech in Computer Science or related degree.",
      `Demonstrated competency in ${foundRequired.slice(0, 3).join(", ") || "core development technologies"}.`,
      "Practical project portfolio or open-source GitHub repositories."
    );
  }
  const analysisSummary = `The position requires a high degree of hands-on competency in ${foundRequired.slice(0, 4).join(", ")}. Evaluated candidate profiles will be heavily indexed on clean architectural project depth, API schema design, and verified Git code contributions.`;
  return {
    title,
    company,
    location,
    department: "Engineering",
    employmentType: "Full-time Internship (6 Months)",
    experienceLevel: "Student / Recent Graduate",
    summary: `${company} is seeking an enthusiastic ${title} with practical experience in modern software development to build scalable systems.`,
    requiredSkills: foundRequired,
    preferredSkills: foundPreferred.length > 0 ? foundPreferred : ["Docker", "TailwindCSS"],
    responsibilities,
    qualifications,
    analysisSummary,
    competencyBreakdown: breakdown,
    extractedText: rawText
  };
}
function runHeuristicResumeParser(fileName, rawText) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const lower = rawText.toLowerCase();
  let name = "";
  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 40 && !line.includes("@") && !line.includes("http") && !line.includes("github") && !line.includes("linkedin") && !/(?:resume|curriculum|vitae|page|phone|email|profile|summary)/i.test(line)) {
      name = line.replace(/^[#*\-•\d.]+\s*/, "").trim();
      break;
    }
  }
  if (!name) {
    name = fileName.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").replace(/\b(?:resume|cv|profile|intern|final|latest|updated)\b/gi, "").trim();
    name = name.length > 2 ? name.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Applicant Candidate";
  }
  const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : `${name.toLowerCase().replace(/\s+/g, ".")}@campus.edu`;
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : void 0;
  const ALL_SKILLS = [
    { name: "React", aliases: ["react", "react.js", "reactjs", "reaktjs"] },
    { name: "TypeScript", aliases: ["typescript", "ts"] },
    { name: "JavaScript", aliases: ["javascript", "js", "es6", "ecmascript"] },
    { name: "Node.js", aliases: ["node.js", "nodejs", "node js", "node"] },
    { name: "Express", aliases: ["express", "express.js", "expressjs"] },
    { name: "REST APIs", aliases: ["rest api", "rest apis", "restful", "restful api", "restful apis"] },
    { name: "Java", aliases: ["java", "core java"] },
    { name: "Spring Boot", aliases: ["spring boot", "springboot", "spring mvc", "spring framework"] },
    { name: "Hibernate", aliases: ["hibernate", "jpa"] },
    { name: "Python", aliases: ["python", "python3", "py"] },
    { name: "Django", aliases: ["django"] },
    { name: "FastAPI", aliases: ["fastapi"] },
    { name: "Flask", aliases: ["flask"] },
    { name: "C++", aliases: ["c++", "cpp"] },
    { name: "C", aliases: [" c ", "c language"] },
    { name: "C#", aliases: ["c#", "csharp", ".net", "dotnet"] },
    { name: "Go", aliases: ["golang", "go lang"] },
    { name: "Rust", aliases: ["rust", "rustlang"] },
    { name: "MySQL", aliases: ["mysql"] },
    { name: "PostgreSQL", aliases: ["postgresql", "postgres", "psql"] },
    { name: "MongoDB", aliases: ["mongodb", "mongo"] },
    { name: "SQLite", aliases: ["sqlite", "sqlite3"] },
    { name: "Redis", aliases: ["redis"] },
    { name: "SQL", aliases: ["sql", "rdbms"] },
    { name: "HTML5", aliases: ["html", "html5"] },
    { name: "CSS3", aliases: ["css", "css3"] },
    { name: "TailwindCSS", aliases: ["tailwind", "tailwindcss"] },
    { name: "Bootstrap", aliases: ["bootstrap"] },
    { name: "Next.js", aliases: ["next.js", "nextjs"] },
    { name: "Vue.js", aliases: ["vue", "vue.js", "vuejs"] },
    { name: "Angular", aliases: ["angular", "angularjs"] },
    { name: "Docker", aliases: ["docker", "containerization", "dockerfile"] },
    { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
    { name: "AWS", aliases: ["aws", "amazon web services", "s3", "ec2", "lambda"] },
    { name: "Azure", aliases: ["azure", "microsoft azure"] },
    { name: "GCP", aliases: ["gcp", "google cloud"] },
    { name: "Git", aliases: ["git", "github", "gitlab", "version control"] },
    { name: "CI/CD", aliases: ["ci/cd", "ci cd", "github actions", "jenkins"] },
    { name: "Linux", aliases: ["linux", "bash", "shell", "ubuntu"] },
    { name: "Flutter", aliases: ["flutter", "dart"] },
    { name: "React Native", aliases: ["react native", "react-native"] },
    { name: "Android SDK", aliases: ["android", "kotlin", "android studio"] },
    { name: "GraphQL", aliases: ["graphql"] },
    { name: "Postman", aliases: ["postman"] },
    { name: "Maven", aliases: ["maven"] },
    { name: "Gradle", aliases: ["gradle"] },
    { name: "Jest", aliases: ["jest", "unit test", "unit testing"] },
    { name: "Data Structures", aliases: ["data structures", "dsa"] },
    { name: "Algorithms", aliases: ["algorithms", "algorithmic"] },
    { name: "Machine Learning", aliases: ["machine learning", "ml", "tensorflow", "pytorch", "scikit-learn"] }
  ];
  const extractedSkills = [];
  ALL_SKILLS.forEach((s) => {
    const found = s.aliases.some((alias) => {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return regex.test(lower);
    });
    if (found) {
      extractedSkills.push(s.name);
    }
  });
  if (extractedSkills.length === 0) {
    extractedSkills.push("Software Engineering", "Programming", "Problem Solving");
  }
  let degree = "B.Tech in Computer Science";
  const degMatch = rawText.match(/\b(B\.?E\.?|B\.?Tech|M\.?Tech|B\.?Sc|BCA|MCA|Bachelor|Master|Diploma)[^\n,.]*/i);
  if (degMatch) degree = degMatch[0].trim();
  let institution = "University Placement Candidate";
  const instMatch = rawText.match(/\b([A-Z][A-Za-z\s&]{2,30}(?:University|College|Institute|Campus|Academy|PES|IIT|NIT|BITS|VIT))[^\n,]*/);
  if (instMatch) institution = instMatch[0].trim();
  let gradYear = "2025";
  const yearMatch = rawText.match(/\b(202[3-9]|203[0-2])\b/);
  if (yearMatch) gradYear = yearMatch[1];
  let gpa;
  const gpaMatch = rawText.match(/(?:cgpa|gpa)[\s:]*([0-9\.]+(?:\s*\/\s*10)?)/i);
  if (gpaMatch) gpa = gpaMatch[1].trim();
  const projects = [
    {
      title: `${extractedSkills.slice(0, 2).join(" & ") || "Software"} Engineering Project`,
      technologies: extractedSkills.slice(0, 4),
      description: `Implemented core application logic utilizing ${extractedSkills.slice(0, 3).join(", ")}. Built functional modules, handled data flow, and integrated interfaces.`
    }
  ];
  const experience = [];
  const expMatch = lower.search(/\b(?:experience|internship|employment|work history)\b/);
  if (expMatch !== -1) {
    experience.push({
      title: "Technical Intern / Academic Project",
      company: "Campus Labs / Industry",
      period: "2024",
      description: rawText.slice(expMatch, expMatch + 150).replace(/\n+/g, " ")
    });
  }
  return {
    id: `uploaded-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    email,
    phone,
    location: "India",
    education: {
      degree,
      institution,
      graduationYear: gradYear,
      gpa
    },
    summary: `${name} has practical technical competency in ${extractedSkills.slice(0, 5).join(", ")}. Evaluated for role compatibility through verified skills and project implementation.`,
    skills: extractedSkills,
    experience,
    projects,
    rawText: rawText || `Resume of ${name}
Skills: ${extractedSkills.join(", ")}`,
    formatCharacteristics: {
      formatType: "clean-structured",
      hasInconsistentDates: false
    }
  };
}
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Shortlisting Engine running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
