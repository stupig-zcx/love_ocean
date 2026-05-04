<template>
  <svg class="ocean-seabed-art" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="sandGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#2a6f74" stop-opacity="0.22" />
        <stop offset="46%" stop-color="#1f5b57" stop-opacity="0.44" />
        <stop offset="100%" stop-color="#071d2b" stop-opacity="0.92" />
      </linearGradient>
      <linearGradient id="reefGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#355f67" />
        <stop offset="58%" stop-color="#1d3f4a" />
        <stop offset="100%" stop-color="#0a1f2d" />
      </linearGradient>
      <linearGradient id="grassGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#49b87b" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#0f4b41" stop-opacity="0.86" />
      </linearGradient>
      <filter id="softSeabedShadow" x="-20%" y="-30%" width="140%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#00111f" flood-opacity="0.38" />
      </filter>
    </defs>

    <path
      class="seabed-sand"
      d="M0 205 C135 181 228 214 350 190 C506 160 640 205 777 182 C914 159 1026 183 1138 174 C1260 164 1354 184 1440 165 L1440 260 L0 260 Z"
      fill="url(#sandGradient)"
    />

    <g class="seabed-reef seabed-reef--left" filter="url(#softSeabedShadow)">
      <path d="M42 211 C74 161 134 151 182 181 C222 166 270 174 296 216 L296 260 L42 260 Z" fill="url(#reefGradient)" />
      <path d="M88 208 C110 188 139 189 155 213 C176 195 209 200 222 224 L88 224 Z" fill="#102f3c" opacity="0.74" />
      <path d="M58 214 C82 205 99 207 117 222" fill="none" stroke="#5b8d8d" stroke-opacity="0.18" stroke-width="4" />
      <path d="M210 194 C226 187 248 193 260 209" fill="none" stroke="#80a5a1" stroke-opacity="0.16" stroke-width="3" />
    </g>

    <g class="seabed-reef seabed-reef--right" filter="url(#softSeabedShadow)">
      <path d="M1136 205 C1182 152 1254 145 1300 184 C1332 171 1386 177 1418 214 L1418 260 L1136 260 Z" fill="url(#reefGradient)" />
      <path d="M1180 210 C1208 184 1250 188 1266 218 C1294 194 1336 202 1352 225 L1180 225 Z" fill="#112d3b" opacity="0.78" />
      <path d="M1166 210 C1190 199 1217 204 1236 220" fill="none" stroke="#6e9998" stroke-opacity="0.18" stroke-width="4" />
      <path d="M1324 191 C1345 187 1370 196 1382 214" fill="none" stroke="#a1b9ad" stroke-opacity="0.15" stroke-width="3" />
    </g>

    <g class="seabed-coral seabed-coral--left">
      <path d="M384 238 C386 214 384 198 371 181 M384 214 C397 201 407 188 407 170 M383 224 C365 207 354 194 350 174" />
      <path d="M424 239 C426 213 434 196 452 181 M431 216 C448 207 461 195 468 177 M425 226 C412 211 405 197 403 180" />
    </g>

    <g class="seabed-coral seabed-coral--right">
      <path d="M1018 238 C1020 211 1016 192 1002 171 M1018 218 C1033 202 1042 188 1040 168 M1017 226 C998 208 988 193 986 176" />
      <path d="M1062 239 C1062 216 1072 198 1091 183 M1068 218 C1087 208 1102 194 1108 176 M1062 228 C1048 214 1040 199 1038 181" />
    </g>

    <g class="seabed-grass seabed-grass--left">
      <path d="M170 250 C166 218 171 189 188 158" />
      <path d="M190 250 C190 214 200 186 222 150" />
      <path d="M212 250 C207 220 216 194 240 166" />
      <path d="M236 250 C230 222 238 203 258 181" />
    </g>

    <g class="seabed-grass seabed-grass--middle">
      <path d="M650 250 C646 220 654 189 674 156" />
      <path d="M675 250 C674 213 687 184 714 146" />
      <path d="M704 250 C701 222 713 198 739 172" />
      <path d="M728 250 C722 226 728 208 748 188" />
    </g>

    <g class="seabed-grass seabed-grass--right">
      <path d="M1212 250 C1206 216 1214 190 1234 154" />
      <path d="M1238 250 C1238 214 1250 187 1275 151" />
      <path d="M1268 250 C1263 221 1274 198 1300 171" />
      <path d="M1294 250 C1288 226 1294 208 1315 186" />
    </g>
  </svg>
</template>
