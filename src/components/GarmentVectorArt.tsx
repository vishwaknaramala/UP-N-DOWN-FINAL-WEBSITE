import React from 'react';
import { CustomApparelDesign } from '../types';

interface GarmentVectorArtProps {
  category: 'caps' | 'pants' | 'tshirts';
  view?: 'front' | 'back' | 'technical';
  colorHex?: string;
  showMeasurements?: boolean;
  customDesign?: CustomApparelDesign;
}

export const GarmentVectorArt: React.FC<GarmentVectorArtProps> = ({
  category,
  view = 'front',
  colorHex = '#18181b',
  showMeasurements = false,
  customDesign,
}) => {
  const activeColor = customDesign?.colorHex || colorHex;
  const isLight =
    activeColor.toLowerCase() === '#f4f4f5' ||
    activeColor.toLowerCase() === '#e4e4e7' ||
    activeColor.toLowerCase() === '#d4d4d8';
  const strokeColor = isLight ? '#27272a' : '#ffffff';
  const seamColor = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.28)';
  const accentColor = customDesign?.artworkColor || (isLight ? '#09090b' : '#fafafa');

  // Render Custom Artwork / Graphic Element
  const renderCustomGraphic = (targetPos: string) => {
    if (!customDesign) return null;
    if (customDesign.artworkPreset === 'blank') return null;

    // Check if graphic should show in this view and position
    const pos = customDesign.artworkPosition;
    let shouldRender = false;
    let x = 250;
    let y = 220;
    let scale = customDesign.artworkScale === 'small' ? 0.06 : customDesign.artworkScale === 'large' ? 0.14 : 0.09;

    if (category === 'tshirts') {
      if (view === 'front' && pos === 'chest' && targetPos === 'chest') {
        shouldRender = true;
        x = 250;
        y = 210;
      } else if (view === 'front' && pos === 'pocket' && targetPos === 'pocket') {
        shouldRender = true;
        x = 180;
        y = 175;
        scale *= 0.75;
      } else if (view === 'back' && pos === 'back' && targetPos === 'back') {
        shouldRender = true;
        x = 250;
        y = 230;
        scale *= 1.4;
      } else if (view === 'front' && pos === 'hem' && targetPos === 'hem') {
        shouldRender = true;
        x = 150;
        y = 360;
        scale *= 0.6;
      }
    } else if (category === 'pants') {
      if (view === 'front' && (pos === 'pocket' || targetPos === 'pocket')) {
        shouldRender = true;
        x = 190;
        y = 160;
        scale *= 0.65;
      } else if (view === 'back' && targetPos === 'back') {
        shouldRender = true;
        x = 200;
        y = 160;
        scale *= 0.65;
      }
    } else if (category === 'caps') {
      if (view === 'front' && targetPos === 'capFront') {
        shouldRender = true;
        x = 250;
        y = 190;
        scale *= 0.7;
      }
    }

    if (!shouldRender) return null;

    // If user provided a custom uploaded image/artwork
    if (customDesign.customArtworkUrl) {
      const imgSize = scale * 500;
      return (
        <image
          href={customDesign.customArtworkUrl}
          x={x - imgSize / 2}
          y={y - imgSize / 2}
          width={imgSize}
          height={imgSize}
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none drop-shadow-md"
        />
      );
    }

    // Preset 1: Monogram
    if (customDesign.artworkPreset === 'monogram') {
      return (
        <g transform={`translate(${x - 250 * scale}, ${y - 250 * scale}) scale(${scale})`} fill={accentColor}>
          {/* U */}
          <path d="M 112 118 L 142 90 L 172 118 L 156 118 L 156 250 C 156 295 178 322 214 322 C 238 322 250 308 256 286 L 256 122 L 288 122 L 288 288 C 288 335 258 358 214 358 C 158 358 124 315 124 250 L 124 118 Z" />
          {/* N */}
          <path d="M 228 178 L 252 178 L 286 288 L 286 178 L 310 178 L 310 326 L 286 326 L 252 216 L 252 326 L 228 326 Z" opacity="0.9" />
          {/* D */}
          <path d="M 298 178 L 358 178 C 406 178 440 212 440 262 C 440 316 402 352 348 352 L 250 352 L 228 382 L 250 410 L 272 382 L 298 382 L 298 352 L 298 178 Z M 330 210 L 330 320 L 348 320 C 382 320 406 298 406 262 C 406 226 382 210 348 210 L 330 210 Z" />
          {/* Star */}
          <path d="M 256 182 C 256 226 222 250 190 250 C 222 250 256 274 256 318 C 256 274 290 250 322 250 C 290 250 256 226 256 182 Z" />
        </g>
      );
    }

    // Preset 2: Star Crest
    if (customDesign.artworkPreset === 'star') {
      return (
        <g transform={`translate(${x - 250 * scale}, ${y - 250 * scale}) scale(${scale * 1.3})`} fill={accentColor}>
          <path d="M 256 150 C 256 215 205 250 160 250 C 205 250 256 285 256 350 C 256 285 307 250 352 250 C 307 250 256 215 256 150 Z" />
          <line x1="256" y1="130" x2="256" y2="370" stroke={accentColor} strokeWidth="3" />
          <line x1="140" y1="250" x2="372" y2="250" stroke={accentColor} strokeWidth="3" />
        </g>
      );
    }

    // Preset 3: Mantra
    if (customDesign.artworkPreset === 'mantra') {
      return (
        <g textAnchor="middle" fill={accentColor} className="font-mono font-bold text-center">
          <text x={x} y={y - 8} fontSize="11" letterSpacing="4">UP N DOWN</text>
          <text x={x} y={y + 8} fontSize="7" letterSpacing="2" opacity="0.8">SAME ENERGY DIFFERENT PHASE</text>
        </g>
      );
    }

    // Preset 4: Barcode / Coordinates
    if (customDesign.artworkPreset === 'barcode') {
      return (
        <g transform={`translate(${x - 40}, ${y - 12})`} fill={accentColor}>
          <rect x="0" y="0" width="3" height="20" />
          <rect x="6" y="0" width="1" height="20" />
          <rect x="10" y="0" width="5" height="20" />
          <rect x="18" y="0" width="2" height="20" />
          <rect x="23" y="0" width="4" height="20" />
          <rect x="30" y="0" width="1" height="20" />
          <rect x="34" y="0" width="6" height="20" />
          <rect x="43" y="0" width="2" height="20" />
          <rect x="48" y="0" width="5" height="20" />
          <rect x="56" y="0" width="1" height="20" />
          <rect x="60" y="0" width="4" height="20" />
          <text x="35" y="28" fontSize="6" fontFamily="monospace" textAnchor="middle">31 DEC / 100 SLOTS</text>
        </g>
      );
    }

    return null;
  };

  // 1. ARCHITECTURAL DENIM LOOSE PANT
  if (category === 'pants') {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4 select-none">
        <svg
          viewBox="0 0 500 500"
          className="w-full max-h-[380px] drop-shadow-2xl transition-all duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="250" cy="460" rx="180" ry="18" fill="rgba(0,0,0,0.5)" filter="blur(10px)" />

          <g transform="translate(0, 10)">
            {/* Main Wide-Leg Denim Outline */}
            <path
              d="
                M 160 50
                L 340 50
                L 355 120
                L 380 430
                L 285 430
                L 255 210
                L 245 210
                L 215 430
                L 120 430
                L 145 120
                Z
              "
              fill={activeColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Waistband */}
            <path
              d="M 160 50 L 340 50 L 337 78 L 163 78 Z"
              fill={activeColor}
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Belt Loops */}
            <rect x="180" y="48" width="6" height="32" fill={strokeColor} opacity="0.7" />
            <rect x="230" y="48" width="6" height="32" fill={strokeColor} opacity="0.7" />
            <rect x="264" y="48" width="6" height="32" fill={strokeColor} opacity="0.7" />
            <rect x="314" y="48" width="6" height="32" fill={strokeColor} opacity="0.7" />

            {/* Back / Front views */}
            {view === 'back' ? (
              <>
                <path d="M 155 105 L 250 125 L 345 105" stroke={seamColor} strokeWidth="2" />
                <path d="M 250 78 L 250 210" stroke={seamColor} strokeWidth="2" />
                <path
                  d="M 175 125 L 225 125 L 225 180 L 200 195 L 175 180 Z"
                  stroke={seamColor}
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M 185 145 Q 200 160 215 145" stroke={seamColor} strokeWidth="1.5" />
                <path
                  d="M 275 125 L 325 125 L 325 180 L 300 195 L 275 180 Z"
                  stroke={seamColor}
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M 285 145 Q 300 160 315 145" stroke={seamColor} strokeWidth="1.5" />
                
                {/* Leather Patch */}
                <rect x="290" y="55" width="45" height="20" fill="#78350f" stroke="#b45309" strokeWidth="1" />
                <text x="312" y="68" fill="#fef3c7" fontSize="5" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
                  {customDesign?.customText ? customDesign.customText.substring(0, 10).toUpperCase() : 'UP N DOWN'}
                </text>
                {renderCustomGraphic('back')}
              </>
            ) : (
              <>
                <circle cx="250" cy="64" r="5" fill="#a1a1aa" stroke="#27272a" strokeWidth="1.5" />
                <path d="M 250 78 L 250 145 C 250 170 236 175 228 175" stroke={seamColor} strokeWidth="2" />
                <path d="M 163 78 C 175 95 190 115 220 120" stroke={seamColor} strokeWidth="2" fill="none" />
                <path d="M 180 84 L 205 84 L 205 105 L 180 105 Z" stroke={seamColor} strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M 337 78 C 325 95 310 115 280 120" stroke={seamColor} strokeWidth="2" fill="none" />
                <circle cx="220" cy="120" r="3" fill="#a1a1aa" stroke="#27272a" strokeWidth="1" />
                <circle cx="280" cy="120" r="3" fill="#a1a1aa" stroke="#27272a" strokeWidth="1" />
                <circle cx="165" cy="80" r="3" fill="#a1a1aa" stroke="#27272a" strokeWidth="1" />
                <circle cx="335" cy="80" r="3" fill="#a1a1aa" stroke="#27272a" strokeWidth="1" />
                {renderCustomGraphic('pocket')}
              </>
            )}

            {/* Inseam & Outseam */}
            <path d="M 245 210 L 215 430" stroke={seamColor} strokeWidth="2" />
            <path d="M 255 210 L 285 430" stroke={seamColor} strokeWidth="2" />
            <path d="M 145 120 L 120 430" stroke={seamColor} strokeWidth="2" />
            <path d="M 355 120 L 380 430" stroke={seamColor} strokeWidth="2" />

            {/* Stack creases */}
            <path d="M 130 380 Q 165 372 205 382" stroke={seamColor} strokeWidth="1.8" />
            <path d="M 125 405 Q 165 398 210 408" stroke={seamColor} strokeWidth="1.8" />
            <path d="M 295 382 Q 335 372 370 380" stroke={seamColor} strokeWidth="1.8" />
            <path d="M 290 408 Q 335 398 375 405" stroke={seamColor} strokeWidth="1.8" />

            <line x1="120" y1="422" x2="215" y2="422" stroke={seamColor} strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="285" y1="422" x2="380" y2="422" stroke={seamColor} strokeWidth="1.5" strokeDasharray="3 3" />

            {view === 'technical' && (
              <g className="font-mono text-[9px]" fill="#38bdf8" stroke="none">
                <text x="250" y="30" textAnchor="middle">14.5 OZ RIGID SELVEDGE DENIM</text>
                <text x="160" y="445" textAnchor="middle">WIDE 20.5" SWEEP</text>
                <text x="340" y="445" textAnchor="middle">STACKED ANKLE BREAK</text>
              </g>
            )}
          </g>

          {showMeasurements && (
            <g className="font-mono text-[10px]" opacity="0.85">
              <line x1="160" y1="45" x2="340" y2="45" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" />
              <rect x="215" y="34" width="70" height="18" fill="#09090b" rx="2" stroke="#f43f5e" strokeWidth="1" />
              <text x="250" y="47" fill="#f43f5e" textAnchor="middle" fontSize="10">WAIST 86cm</text>
              <line x1="100" y1="50" x2="100" y2="440" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" />
              <rect x="65" y="240" width="75" height="18" fill="#09090b" rx="2" stroke="#f43f5e" strokeWidth="1" />
              <text x="102" y="253" fill="#f43f5e" textAnchor="middle" fontSize="10">LENGTH 108cm</text>
            </g>
          )}
        </svg>
      </div>
    );
  }

  // 2. HEAVYWEIGHT TEES
  if (category === 'tshirts') {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4 select-none">
        <svg
          viewBox="0 0 500 480"
          className="w-full max-h-[380px] drop-shadow-2xl transition-all duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="250" cy="445" rx="180" ry="18" fill="rgba(0,0,0,0.5)" filter="blur(10px)" />

          <g transform="translate(0, 20)">
            {/* Boxy Tee Main Torso & Dropped Elbow Sleeves */}
            <path
              d="
                M 175 60
                L 60 115
                L 35 240
                L 95 255
                L 125 180
                L 120 405
                L 380 405
                L 375 180
                L 405 255
                L 465 240
                L 440 115
                L 325 60
                Q 250 82 175 60
                Z
              "
              fill={activeColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Thick 1.3-inch High-Density Mock Neck Collar */}
            <path
              d="M 175 60 Q 250 85 325 60 Q 250 102 175 60 Z"
              fill={activeColor}
              stroke={strokeColor}
              strokeWidth="2"
            />
            <path
              d="M 195 68 Q 250 92 305 68"
              stroke={seamColor}
              strokeWidth="1.5"
            />

            {/* Dropped Armhole Seams */}
            <path d="M 125 180 L 175 60" stroke={seamColor} strokeWidth="2" />
            <path d="M 375 180 L 325 60" stroke={seamColor} strokeWidth="2" />

            {/* Sleeve Hem lines */}
            <line x1="35" y1="240" x2="95" y2="255" stroke={seamColor} strokeWidth="2" />
            <line x1="465" y1="240" x2="405" y2="255" stroke={seamColor} strokeWidth="2" />

            {/* Clean Blind Bottom Hem */}
            <line x1="120" y1="395" x2="380" y2="395" stroke={seamColor} strokeWidth="1.5" strokeDasharray="5 3" />

            {/* Render Graphic Based On Custom Design Selection */}
            {view === 'front' ? (
              <>
                {renderCustomGraphic('chest')}
                {renderCustomGraphic('pocket')}
                {renderCustomGraphic('hem')}
                {!customDesign && (
                  <g transform="translate(150, 165) scale(0.08)" fill={accentColor} opacity="0.85">
                    <path d="M 122 140 C 138 141 144 150 144 168 L 144 285 C 144 340 175 390 240 390 C 255 390 268 385 280 376 C 264 366 256 348 256 320 L 256 168 C 256 150 262 141 278 140 L 278 135 L 218 135 L 218 140 C 234 141 240 150 240 168 L 240 320 C 240 352 220 372 192 372 C 166 372 160 348 160 310 L 160 168 C 160 150 166 141 182 140 L 182 135 L 122 135 Z"/>
                    <path d="M 292 208 C 345 208 388 242 388 296 C 388 350 345 384 292 384 L 255 384 L 255 378 C 268 376 272 368 272 352 L 272 240 C 272 224 268 216 255 214 L 255 208 Z"/>
                    <path d="M 260 150 Q 260 235 180 235 Q 260 235 260 320 Q 260 235 340 235 Q 260 235 260 150 Z"/>
                  </g>
                )}
                {customDesign?.customText && (
                  <text
                    x="250"
                    y="340"
                    textAnchor="middle"
                    fill={accentColor}
                    fontFamily="monospace"
                    fontSize="10"
                    letterSpacing="3"
                    opacity="0.8"
                  >
                    {customDesign.customText.toUpperCase()}
                  </text>
                )}
              </>
            ) : (
              <g>
                <line x1="250" y1="65" x2="250" y2="405" stroke={seamColor} strokeWidth="1.5" strokeDasharray="3 3" />
                {renderCustomGraphic('back')}
                {!customDesign && (
                  <text
                    x="250"
                    y="120"
                    textAnchor="middle"
                    fill={strokeColor}
                    opacity="0.4"
                    fontFamily="'Space Mono', monospace"
                    fontSize="12"
                    letterSpacing="6"
                  >
                    320 GSM BOX-TEE
                  </text>
                )}
              </g>
            )}
          </g>

          {showMeasurements && (
            <g className="font-mono text-[10px]" opacity="0.85">
              <line x1="120" y1="280" x2="380" y2="280" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" />
              <rect x="210" y="268" width="80" height="18" fill="#09090b" rx="2" stroke="#f43f5e" strokeWidth="1" />
              <text x="250" y="281" fill="#f43f5e" textAnchor="middle" fontSize="10">CHEST 66cm</text>
            </g>
          )}
        </svg>
      </div>
    );
  }

  // 3. BASEBALL CAP
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none">
      <svg
        viewBox="0 0 500 480"
        className="w-full max-h-[380px] drop-shadow-2xl transition-all duration-300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="250" cy="420" rx="170" ry="18" fill="rgba(0,0,0,0.5)" filter="blur(10px)" />

        <g transform="translate(0, 60)">
          {/* 6-Panel Low Crown */}
          <path
            d="
              M 90 260
              C 90 120 180 80 250 80
              C 320 80 410 120 410 260
              Z
            "
            fill={activeColor}
            stroke={strokeColor}
            strokeWidth="2.5"
          />

          {/* Panel Seam 1 (Left) */}
          <path d="M 170 260 C 180 180 220 90 250 80" stroke={seamColor} strokeWidth="1.8" />
          {/* Panel Seam 2 (Center) */}
          <line x1="250" y1="80" x2="250" y2="260" stroke={seamColor} strokeWidth="2" />
          {/* Panel Seam 3 (Right) */}
          <path d="M 330 260 C 320 180 280 90 250 80" stroke={seamColor} strokeWidth="1.8" />

          {/* Eyelets */}
          <circle cx="160" cy="180" r="3.5" fill={strokeColor} opacity="0.4" stroke={activeColor} strokeWidth="1" />
          <circle cx="210" cy="150" r="3.5" fill={strokeColor} opacity="0.4" stroke={activeColor} strokeWidth="1" />
          <circle cx="290" cy="150" r="3.5" fill={strokeColor} opacity="0.4" stroke={activeColor} strokeWidth="1" />
          <circle cx="340" cy="180" r="3.5" fill={strokeColor} opacity="0.4" stroke={activeColor} strokeWidth="1" />

          {/* Crown Top Button */}
          <ellipse cx="250" cy="80" rx="9" ry="5" fill={activeColor} stroke={strokeColor} strokeWidth="2" />

          {/* Visor */}
          <path
            d="
              M 70 265
              C 70 330 430 330 430 265
              C 370 278 130 278 70 265
              Z
            "
            fill={activeColor}
            stroke={strokeColor}
            strokeWidth="2.5"
          />

          <path d="M 100 278 C 150 295 350 295 400 278" stroke={seamColor} strokeWidth="1.2" strokeDasharray="4 2" />
          <path d="M 120 288 C 170 305 330 305 380 288" stroke={seamColor} strokeWidth="1.2" strokeDasharray="4 2" />
          <path d="M 140 298 C 190 312 310 312 360 298" stroke={seamColor} strokeWidth="1.2" strokeDasharray="4 2" />

          {/* Hardware rivet */}
          <circle cx="115" cy="245" r="4.5" fill="#a1a1aa" stroke="#27272a" strokeWidth="1" />

          {/* Graphic on Cap Front */}
          {renderCustomGraphic('capFront')}
          {customDesign?.customText && (
            <text
              x="250"
              y="225"
              textAnchor="middle"
              fill={accentColor}
              fontFamily="monospace"
              fontSize="9"
              letterSpacing="2"
              opacity="0.9"
            >
              {customDesign.customText.toUpperCase()}
            </text>
          )}

          {view === 'back' && (
            <g>
              <path d="M 215 258 C 215 230 285 230 285 258" stroke={strokeColor} strokeWidth="2" fill="#09090b" />
              <rect x="220" y="250" width="60" height="10" fill="#27272a" stroke="#71717a" strokeWidth="1" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
