
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Project, UserProfile, AIResult } from '../types';

export const exportProjectToPDF = async (project: Project, profile: UserProfile) => {
  const doc = new jsPDF();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(profile.brandColors.primary);
  doc.text(profile.businessName, margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${profile.email} | ${profile.phone} | ${profile.website}`, margin, y);
  y += 15;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 15;

  // Project Info
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(`Project: ${project.coupleNames}`, margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Date: ${new Date(project.weddingDate).toLocaleDateString('el-GR')}`, margin, y);
  y += 7;
  doc.text(`Location: ${project.location}`, margin, y);
  y += 7;
  doc.text(`Style: ${project.style}`, margin, y);
  y += 15;

  // Contact Info
  doc.setFontSize(14);
  doc.text('Client Contact Info', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Email: ${project.contact.email}`, margin, y);
  y += 5;
  doc.text(`Phone: ${project.contact.phone}`, margin, y);
  y += 15;

  // Deliverables
  doc.setFontSize(14);
  doc.text('Deliverables Checklist', margin, y);
  y += 8;
  doc.setFontSize(10);
  Object.entries(project.deliverables).forEach(([key, value]) => {
    const status = value ? '[X]' : '[ ]';
    doc.text(`${status} ${key}`, margin + 5, y);
    y += 5;
  });
  y += 10;

  // Notes
  if (project.notes) {
    doc.setFontSize(14);
    doc.text('Notes', margin, y);
    y += 8;
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(project.notes, 170);
    doc.text(splitNotes, margin, y);
  }

  doc.save(`${project.coupleNames}_Project_Report.pdf`);
};

export const exportAIResultToPDF = async (result: AIResult, profile: UserProfile) => {
  const doc = new jsPDF();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(profile.brandColors.primary);
  doc.text(profile.businessName, margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(result.title, margin, y);
  y += 15;

  // Content
  doc.setFontSize(10);
  const splitContent = doc.splitTextToSize(result.content, 170);
  
  // Handle multi-page
  let currentY = y;
  splitContent.forEach((line: string) => {
    if (currentY > 280) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(line, margin, currentY);
    currentY += 5;
  });

  doc.save(`${result.title.replace(/\s+/g, '_')}.pdf`);
};

export const exportContractToPDF = async (project: Project, profile: UserProfile) => {
  const doc = new jsPDF();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(profile.brandColors.primary);
  doc.text(profile.businessName, margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${profile.address}`, margin, y);
  y += 5;
  doc.text(`${profile.email} | ${profile.phone}`, margin, y);
  y += 15;

  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text('Service Agreement', margin, y);
  y += 15;

  doc.setFontSize(12);
  doc.text(`This agreement is between ${profile.businessName} and ${project.coupleNames}.`, margin, y);
  y += 10;
  doc.text(`Wedding Date: ${new Date(project.weddingDate).toLocaleDateString('el-GR')}`, margin, y);
  y += 7;
  doc.text(`Location: ${project.location}`, margin, y);
  y += 15;

  // Contract Content
  doc.setFontSize(10);
  const splitContent = doc.splitTextToSize(profile.contractTemplate, 170);
  
  let currentY = y;
  splitContent.forEach((line: string) => {
    if (currentY > 280) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(line, margin, currentY);
    currentY += 5;
  });

  // Signatures
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  currentY += 20;
  doc.line(margin, currentY, margin + 70, currentY);
  doc.line(120, currentY, 190, currentY);
  currentY += 5;
  doc.text('Videographer Signature', margin, currentY);
  doc.text('Client Signature', 120, currentY);

  doc.save(`${project.coupleNames}_Contract.pdf`);
};
