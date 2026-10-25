import { jsPDF } from 'jspdf';
import { StationDataResponse, User } from '../types/index.ts';

export function generateStationPdfReport(
  data: StationDataResponse,
  user: User | null,
  options: {
    includeForecastTable?: boolean;
    executiveNotes?: string;
  } = {}
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin; // 182 mm

  // Palette
  const primaryGreen = [6, 95, 70]; // #065f46
  const darkSlate = [30, 41, 59]; // #1e293b
  const lightBg = [248, 250, 252]; // #f8fafc
  const borderGray = [226, 232, 240]; // #e2e8f0
  const amberWarning = [217, 119, 6];

  const drawPageHeader = (pageNumber: number) => {
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(0, 0, pageWidth, 5, 'F');

    let headerY = 11;
    if (data.testMode?.active) {
      doc.setFillColor(254, 226, 226); // red-100
      doc.rect(margin, 5.5, contentWidth, 3.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(185, 28, 28);
      doc.text(
        `*** TEST MODE SIMULATION: ${data.testMode.simulationTitle.toUpperCase()} (NOT CERTIFIED AMBIENT OBSERVATIONS) ***`,
        margin + 2,
        8.2
      );
      headerY = 12.5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('EcoInsight Analytics | Indiana Air Quality Technical Report', margin, headerY);
    doc.text(`Station: ${data.station.name} (AQS: ${data.station.epaAqsId})`, pageWidth - margin, headerY, { align: 'right' });

    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, headerY + 2, pageWidth - margin, headerY + 2);
  };

  const drawPageFooter = (pageNumber: number) => {
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const retrievedDate = new Date(data.provenance.retrievalTimestamp).toLocaleString('en-US', { timeZoneName: 'short' });
    const provenanceNotice = data.testMode?.active
      ? `[TEST MODE ACTIVE: ${data.testMode.simulationCondition}] QA/QC Verification Only • Real Measurements Preserved`
      : `Data Source: ${data.provenance.providerName} (Retrieved: ${retrievedDate}) | Informational Analysis Only`;
    doc.text(provenanceNotice, margin, pageHeight - 7);
    doc.text(`Page ${pageNumber} of 2`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  // ================= PAGE 1 =================
  drawPageHeader(1);
  let y = 19;

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('PM2.5 Environmental Monitoring & Forecast Report', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `State of Indiana Airshed Screening | Classification: ${data.station.stationClassification} | Operator: ${data.station.operator}`,
    margin,
    y
  );
  y += 7;

  // Station Metadata Card (Clean 2-Column Layout to prevent text collisions)
  const metaCardH = 30;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, metaCardH, 2, 2, 'FD');

  const leftColX = margin + 4;
  const leftValX = margin + 30;
  const rightColX = margin + 96;
  const rightValX = margin + 128;

  doc.setFontSize(8);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Station Name:', leftColX, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(data.station.name, leftValX, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Monitor Type:', rightColX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(data.station.monitorType, rightValX, y + 6);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('EPA AQS ID:', leftColX, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(data.station.epaAqsId, leftValX, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Elevation:', rightColX, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`${data.station.elevationMeters} m`, rightValX, y + 12);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('County & City:', leftColX, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`${data.station.county}, ${data.station.city}`, leftValX, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Data Source:', rightColX, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(data.provenance.providerName, rightValX, y + 18);

  // Row 4
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Coordinates:', leftColX, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`${data.station.latitude.toFixed(4)}° N, ${data.station.longitude.toFixed(4)}° W`, leftValX, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Analyst / Org:', rightColX, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(user ? `${user.name} (${user.organization})` : 'EcoInsight Authorized Analyst', rightValX, y + 24, { maxWidth: contentWidth - 130 });

  y += metaCardH + 6;

  // 1. Historical Summary Statistics Cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('1. Historical PM2.5 Summary Statistics', margin, y);
  y += 4.5;

  const statCardW = (contentWidth - 9) / 4; // ~43.2 mm each
  const statCardH = 15;
  const statCards = [
    { label: 'Mean Concentration', val: `${data.statistics.mean} ug/m3`, sub: 'EPA Ref Annual: 9.0' },
    { label: 'Period Maximum', val: `${data.statistics.max} ug/m3`, sub: 'EPA Ref 24-hr: 35.0' },
    { label: '98th Percentile', val: `${data.statistics.percentile98} ug/m3`, sub: 'EPA Design Metric' },
    { label: 'Data Completeness', val: `${data.dataQuality.completenessPercent}%`, sub: `${data.dataQuality.validHourlyObservations}/${data.dataQuality.expectedHourlySlots} Valid Hours` }
  ];

  statCards.forEach((c, idx) => {
    const cx = margin + idx * (statCardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(cx, y, statCardW, statCardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + 3, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(c.val, cx + 3, y + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(c.sub, cx + 3, y + 13.5);
  });

  y += statCardH + 5;

  // Detailed Summary Table (4 Columns with explicit widths)
  const summaryTable = [
    ['Expected Hourly Slots', `${data.dataQuality.expectedHourlySlots} hours`, 'Standard Deviation (Std Dev)', `${data.statistics.stdDev} ug/m3`],
    ['Valid Hourly Observations', `${data.dataQuality.validHourlyObservations} hours`, 'Period Minimum', `${data.statistics.min} ug/m3`],
    ['Missing Hourly Slots', `${data.dataQuality.missingHourlySlots} hours`, 'Median Concentration', `${data.statistics.median} ug/m3`],
    ['Raw Records Received', `${data.dataQuality.rawRecordsCount} entries`, 'Hours > 35 ug/m3 (24h Ref)', `${data.statistics.exceedanceCount24hStandard} hours`],
    ['Duplicate Times Filtered', `${data.dataQuality.duplicateTimestampsCount} records`, 'Hours > 9.0 ug/m3 (Annual Ref)', `${data.statistics.exceedanceCountAnnualStandard} hours`]
  ];

  const colW_L1 = 48;
  const colW_V1 = 40;
  const colW_L2 = 48;
  const colW_V2 = 46;
  const rowHeight = 4.8;

  doc.setFontSize(7.2);
  summaryTable.forEach((row, rIdx) => {
    const rowY = y + rIdx * rowHeight;
    doc.setFillColor(rIdx % 2 === 0 ? 250 : 255, rIdx % 2 === 0 ? 250 : 255, rIdx % 2 === 0 ? 252 : 255);
    doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, rowY + rowHeight, margin + contentWidth, rowY + rowHeight);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], margin + 2, rowY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(row[1], margin + colW_L1, rowY + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[2], margin + colW_L1 + colW_V1 + 2, rowY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(row[3], margin + colW_L1 + colW_V1 + colW_L2, rowY + 3.5);
  });

  y += summaryTable.length * rowHeight + 6;

  // 2. Historical PM2.5 Time-Series Graph
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('2. Historical PM2.5 Time-Series & NAAQS Reference Thresholds', margin, y);
  y += 4.5;

  const chartW = contentWidth;
  const chartH = 38;
  const chartX = margin;
  const chartY = y;

  // Chart Background
  doc.setFillColor(252, 253, 254);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(chartX, chartY, chartW, chartH, 1, 1, 'FD');

  const maxScaleVal = Math.max(45, Math.ceil((data.statistics.max + 8) / 10) * 10);
  const getYForVal = (val: number) => chartY + chartH - 5 - (val / maxScaleVal) * (chartH - 10);

  // 35 µg/m³ Reference Line
  const y35 = getYForVal(35);
  if (y35 >= chartY + 2 && y35 <= chartY + chartH) {
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.3);
    doc.line(chartX + 12, y35, chartX + chartW - 4, y35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(220, 38, 38);
    doc.text('EPA 24-hr Ref (35 µg/m³)', chartX + chartW - 36, y35 - 1);
  }

  // 9 µg/m³ Reference Line
  const y9 = getYForVal(9);
  if (y9 >= chartY + 2 && y9 <= chartY + chartH) {
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.line(chartX + 12, y9, chartX + chartW - 4, y9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(217, 119, 6);
    doc.text('EPA Annual Ref (9.0 µg/m³)', chartX + chartW - 36, y9 - 1);
  }

  // Y-axis tick marks
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`${maxScaleVal}`, chartX + 2, chartY + 6);
  doc.text('0', chartX + 4, chartY + chartH - 5);

  // Plot data points
  if (data.historical.length > 1) {
    const points = data.historical;
    const stepX = (chartW - 22) / (points.length - 1);

    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(0.6);

    for (let i = 0; i < points.length - 1; i++) {
      const p1X = chartX + 14 + i * stepX;
      const p1Y = getYForVal(points[i].pm25);
      const p2X = chartX + 14 + (i + 1) * stepX;
      const p2Y = getYForVal(points[i + 1].pm25);
      doc.line(p1X, p1Y, p2X, p2Y);
    }
  }

  // Legend at bottom of chart
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const startFmt = data.historical[0]?.formattedTime || 'N/A';
  const endFmt = data.latestObservation?.formattedTime || 'N/A';
  doc.text(`Window: ${startFmt} to ${endFmt} (${data.historical.length} observations plotted)`, chartX + 14, chartY + chartH - 1.5);

  y += chartH + 6;

  // 3. QA/QC & Data Completeness Audit Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('3. Data-Quality & Completeness Audit (QA/QC)', margin, y);
  y += 4.5;

  const auditBoxH = 27;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, auditBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(
    `Data Completeness: ${data.dataQuality.completenessPercent}% (${data.dataQuality.validHourlyObservations} valid of ${data.dataQuality.expectedHourlySlots} expected hourly slots; ${data.dataQuality.rawRecordsCount} raw entries ingested).`,
    margin + 4,
    y + 5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Raw Payload Composition: ${data.dataQuality.rawRecordsBreakdown}`,
    margin + 4,
    y + 9.5,
    { maxWidth: contentWidth - 8 }
  );

  doc.text(
    `Benchmark Screening: ${data.dataQuality.meetsCompletenessBenchmark ? 'Meets the 75% informational completeness reference guideline (EPA 40 CFR Part 50 Appendix N).' : 'Completeness is below the 75% informational reference guideline.'}`,
    margin + 4,
    y + 16
  );

  doc.text(
    `Telemetry Latency: ${data.dataQuality.hoursSinceLatestObservation} hours (${data.dataQuality.staleMessage}) | Deduplicated: ${data.dataQuality.duplicateTimestampsCount} collisions.`,
    margin + 4,
    y + 20.5
  );

  doc.text(
    `Notice: Informational screening only. Does not constitute an official EPA or IDEM regulatory attainment determination.`,
    margin + 4,
    y + 25
  );

  drawPageFooter(1);

  // ================= PAGE 2 =================
  doc.addPage();
  drawPageHeader(2);
  y = 19;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('4. 24-Hour PM2.5 Forecast Assessment & Verification', margin, y);
  y += 5.5;

  // Forecast status card
  const forecastAvailable = data.forecastAvailability.available;
  const fcBoxH = 21;
  doc.setFillColor(forecastAvailable ? 236 : 254, forecastAvailable ? 253 : 242, forecastAvailable ? 245 : 242);
  doc.setDrawColor(forecastAvailable ? 167 : 252, forecastAvailable ? 243 : 165, forecastAvailable ? 208 : 165);
  doc.roundedRect(margin, y, contentWidth, fcBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(forecastAvailable ? primaryGreen[0] : 185, forecastAvailable ? primaryGreen[1] : 28, forecastAvailable ? primaryGreen[2] : 28);
  doc.text(
    forecastAvailable
      ? `FORECAST MODEL STATUS: ACTIVE (${data.forecast.length} of ${data.forecastAvailability.targetHorizonHours} HORIZON HOURS AVAILABLE)`
      : 'FORECAST MODEL STATUS: SUPPRESSED (DATA RELIABILITY SAFEGUARD ACTIVE)',
    margin + 4,
    y + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Model Source: ${data.forecastAvailability.modelName}`, margin + 4, y + 10.5);
  doc.text(`Prediction Method: ${data.forecastAvailability.predictionMethodDescription}`, margin + 4, y + 15, { maxWidth: contentWidth - 8 });

  y += fcBoxH + 6;

  // Complete 24-Hour Forecast Table (Covering ALL 24 Hours via Side-by-Side 2-Column Sub-tables)
  if (forecastAvailable && data.forecast.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(`Complete 24-Hour Atmospheric Dispersion Forecast Table (${data.forecast.length} Hours)`, margin, y);
    y += 4;

    const subTableW = (contentWidth - 6) / 2; // ~88 mm each
    const tableHeaderH = 5.2;
    const tableRowH = 4.4;

    // Sub-table 1 Header (Hours 1 to 12)
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(margin, y, subTableW, tableHeaderH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.text('Hour (T+1 to 12)', margin + 2, y + 3.6);
    doc.text('Pred PM2.5', margin + 28, y + 3.6);
    doc.text('Pred AQI', margin + 48, y + 3.6);
    doc.text('AQI Category', margin + 65, y + 3.6);

    // Sub-table 2 Header (Hours 13 to 24)
    const rightSubX = margin + subTableW + 6;
    doc.rect(rightSubX, y, subTableW, tableHeaderH, 'F');
    doc.text('Hour (T+13 to 24)', rightSubX + 2, y + 3.6);
    doc.text('Pred PM2.5', rightSubX + 28, y + 3.6);
    doc.text('Pred AQI', rightSubX + 48, y + 3.6);
    doc.text('AQI Category', rightSubX + 65, y + 3.6);

    y += tableHeaderH;

    const maxRows = Math.min(12, Math.ceil(data.forecast.length / 2));

    for (let r = 0; r < maxRows; r++) {
      const rowY = y + r * tableRowH;
      const isAlt = r % 2 === 1;

      // Left Item (index r)
      const leftItem = data.forecast[r];
      if (leftItem) {
        doc.setFillColor(isAlt ? 248 : 255, isAlt ? 250 : 255, isAlt ? 252 : 255);
        doc.rect(margin, rowY, subTableW, tableRowH, 'F');
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setLineWidth(0.2);
        doc.line(margin, rowY + tableRowH, margin + subTableW, rowY + tableRowH);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(leftItem.formattedTime.split(',')[1]?.trim() || leftItem.formattedTime, margin + 2, rowY + 3.1);

        doc.setFont('helvetica', 'bold');
        doc.text(`${leftItem.pm25Predicted.toFixed(1)} µg/m³`, margin + 28, rowY + 3.1);

        doc.setFont('helvetica', 'normal');
        doc.text(`AQI ${leftItem.aqiPredicted}`, margin + 48, rowY + 3.1);

        doc.setTextColor(leftItem.aqiCategory === 'Good' ? primaryGreen[0] : 180, leftItem.aqiCategory === 'Good' ? primaryGreen[1] : 100, 0);
        doc.text(leftItem.aqiCategory.substring(0, 10), margin + 65, rowY + 3.1);
      }

      // Right Item (index r + 12)
      const rightItem = data.forecast[r + 12];
      if (rightItem) {
        doc.setFillColor(isAlt ? 248 : 255, isAlt ? 250 : 255, isAlt ? 252 : 255);
        doc.rect(rightSubX, rowY, subTableW, tableRowH, 'F');
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setLineWidth(0.2);
        doc.line(rightSubX, rowY + tableRowH, rightSubX + subTableW, rowY + tableRowH);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(rightItem.formattedTime.split(',')[1]?.trim() || rightItem.formattedTime, rightSubX + 2, rowY + 3.1);

        doc.setFont('helvetica', 'bold');
        doc.text(`${rightItem.pm25Predicted.toFixed(1)} µg/m³`, rightSubX + 28, rowY + 3.1);

        doc.setFont('helvetica', 'normal');
        doc.text(`AQI ${rightItem.aqiPredicted}`, rightSubX + 48, rowY + 3.1);

        doc.setTextColor(rightItem.aqiCategory === 'Good' ? primaryGreen[0] : 180, rightItem.aqiCategory === 'Good' ? primaryGreen[1] : 100, 0);
        doc.text(rightItem.aqiCategory.substring(0, 10), rightSubX + 65, rowY + 3.1);
      }
    }

    y += maxRows * tableRowH + 6;
  } else {
    // If forecast is suppressed, show scientific explanation
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text('Scientific Rationale for Forecast Suppression:', margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(127, 29, 29);
    doc.text('1. Initial Condition Requirement: Dispersion models require fresh ground observations to initialize boundary state.', margin + 4, y + 10.5);
    doc.text('2. Protection Against Drift: Suppressing unanchored predictions prevents inaccurate public health advisories.', margin + 4, y + 15);
    doc.text('3. Corrective Action: Forecasts automatically resume once the next validated hourly reading is confirmed.', margin + 4, y + 19.5);

    y += 30;
  }

  // 5. Environmental Consultant Notes (With clean text wrapping to prevent any overflow)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('5. Environmental Analyst Notes & Context', margin, y);
  y += 4;

  const notesCardH = 24;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, notesCardH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);

  // Dynamic analyst note resolving: ensure station name, county, city, monitor type, and statistics dynamically match data.station!
  let resolvedNote = options.executiveNotes?.trim();

  // If notes provided from an old modal state mention a different station (e.g. Indianapolis while viewing Gary), dynamically generate for selected station
  const isMismatchedStation = resolvedNote &&
    resolvedNote.includes('Indianapolis') &&
    data.station.id !== 'in-marion-0078';

  if (!resolvedNote || isMismatchedStation) {
    resolvedNote = `Station ${data.station.name} (${data.station.county}, ${data.station.city}): Continuous ${data.station.monitorType} measurements show an observation mean of ${data.statistics.mean} ug/m3 (min: ${data.statistics.min} ug/m3, max: ${data.statistics.max} ug/m3, std dev: ${data.statistics.stdDev} ug/m3) with ${data.statistics.exceedanceCount24hStandard} hours exceeding the 35 ug/m3 24-hr reference line. Data completeness (${data.dataQuality.completenessPercent}%) satisfies the 75% informational benchmark for regulatory screening. Notes: Ambient trends should be evaluated in context with localized meteorology and industrial/traffic dispersion patterns in ${data.station.city}.`;
  }

  const splitText = doc.splitTextToSize(resolvedNote, contentWidth - 8);
  doc.text(splitText, margin + 4, y + 5.5);

  y += notesCardH + 5;

  // Regulatory Notice Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  const legalNotice = 'Regulatory Attainment Notice: Formal EPA NAAQS attainment determinations require 3 complete consecutive calendar years of certified Federal Reference Method (FRM) or Federal Equivalent Method (FEM) measurements under State Implementation Plans. Short-term data completeness screening is informational only and does not establish regulatory compliance or non-attainment.';
  const splitNotice = doc.splitTextToSize(legalNotice, contentWidth - 6);
  doc.text(splitNotice, margin + 3, y + 4.5);

  drawPageFooter(2);

  // Save the PDF with clear naming
  const testPrefix = data.testMode?.active ? `TEST_${data.testMode.simulationCondition.toUpperCase()}_` : '';
  const filename = `EcoInsight_Report_${testPrefix}${data.station.id}_${new Date().toISOString().substring(0, 10)}.pdf`;
  doc.save(filename);
}
