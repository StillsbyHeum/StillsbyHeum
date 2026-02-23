import { ContentData, PackageItem, NoticeItem, Review, MenuItem } from './types';

// Admin Credentials (Obfuscated / Base64 Encoded)
// Email: maximinimum9@gmail.com
export const ENCRYPTED_ADMIN_ID = "bWF4aW1pbmltdW05QGdtYWlsLmNvbQ==";
// Password: 0629
export const ENCRYPTED_ADMIN_PW = "MDYyOQ==";

export const NOTICES: NoticeItem[] = [
  {
    id: 'booking',
    icon: null,
    title: { ko: "예약 및 결제 안내", en: "Booking & Payment" },
    description: {
      ko: "• 예약금 10% 입금 시 확정\n• 잔금: 촬영 후 현장 결제 (현금/이체/카드)\n• 촬영 가능: 평일 08:00 ~ 17:00",
      en: "• 10% Deposit to confirm\n• Balance on-site (Cash/Transfer/Card)\n• Weekdays 08:00 - 17:00"
    }
  },
  {
    id: 'refund',
    icon: null,
    title: { ko: "환불 및 규정", en: "Refund Policy" },
    description: {
      ko: "• 7일 전 취소 시 100% 환불\n• 우천 시 날짜 변경 또는 전액 환불\n• 지각 시 촬영 시간에서 차감",
      en: "• 100% Refund 7 days prior\n• Rain: Reschedule or Full Refund\n• Late arrival time deducted"
    }
  },
  {
    id: 'etc',
    icon: null,
    title: { ko: "기타 및 준비물", en: "Details & Props" },
    description: {
      ko: "• 조화 꽃다발 요청 시 제공\n• 짐은 최소화 권장\n• 데이터 손실 시 100% 환불",
      en: "• Bouquet provided upon request\n• Minimize luggage\n• 100% refund for data loss"
    }
  },
  {
    id: 'copyright',
    icon: null,
    title: { ko: "저작권 및 포트폴리오", en: "Copyright & Portfolio" },
    description: {
      ko: "• 촬영된 사진의 저작권은 작가에게 있으며, 포트폴리오로 사용될 수 있습니다.\n• 원치 않으실 경우 사전에 말씀해 주세요.",
      en: "• Copyright belongs to the photographer and photos may be used for portfolio.\n• Please inform us in advance if you do not want this."
    }
  }
];

export const MENU_ITEMS: MenuItem[] = [
  { id: '/', ko: '홈', en: 'STILLS' },
  { id: '/info', ko: '상품', en: 'PRODUCT' },
  { id: '/reviews', ko: '리뷰', en: 'REVIEW' },
  { id: '/faq', ko: 'FAQ', en: 'FAQ' }
];

export const PACKAGES: PackageItem[] = [
  {
    id: '60min',
    title: { ko: "60 Minutes", en: "60 Minutes" },
    price: "£175 / ₩350,000",
    features: {
      ko: ["60분 촬영", "원본 전체 (24시간 내)", "정밀 보정 40장 (셀렉30+작가10)", "폴라로이드 3장 현장 제공"],
      en: ["60 min Session", "All Originals (24h)", "40 Retouched (30 Select + 10 Pro)", "3 Polaroids on-site"]
    },
    color: "bg-white border border-stone-200 text-stone-900",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '90min',
    title: { ko: "90 Minutes", en: "90 Minutes" },
    price: "£200 / ₩400,000",
    features: {
      ko: ["90분 촬영", "원본 전체 (24시간 내)", "정밀 보정 40장 (셀렉30+작가10)", "폴라로이드 3장 현장 제공"],
      en: ["90 min Session", "All Originals (24h)", "40 Retouched (30 Select + 10 Pro)", "3 Polaroids on-site"]
    },
    color: "bg-stone-50 border border-stone-200 text-stone-900",
    image: "https://images.unsplash.com/photo-1520854221256-17451cc330e7?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '120min',
    title: { ko: "120 Minutes", en: "120 Minutes" },
    price: "£250 / ₩500,000",
    features: {
      ko: ["120분 촬영", "원본 전체 (24시간 내)", "정밀 보정 40장 (셀렉30+작가10)", "폴라로이드 3장 현장 제공"],
      en: ["120 min Session", "All Originals (24h)", "40 Retouched (30 Select + 10 Pro)", "3 Polaroids on-site"]
    },
    color: "bg-stone-100 text-stone-900 border border-stone-300",
    image: "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: '180min',
    title: { ko: "180 Minutes", en: "180 Minutes" },
    price: "£350 / ₩700,000",
    features: {
      ko: ["180분 촬영", "원본 전체 (24시간 내)", "정밀 보정 60장 (셀렉45+작가15)", "폴라로이드 5장 현장 제공"],
      en: ["180 min Session", "All Originals (24h)", "60 Retouched (45 Select + 15 Pro)", "5 Polaroids on-site"]
    },
    color: "bg-gradient-to-br from-amber-50 via-[#FFFBEB] to-amber-100 text-amber-900 shadow-[0_20px_60px_rgba(245,158,11,0.15)]",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop"
  }
];

export const INITIAL_CONTENT: ContentData = {
  heroTitle: {
    ko: "Stills by Heum",
    en: "Stills by Heum"
  },
  heroSubtitle: {
    ko: "가장 아름다운 순간을 영원히 기록합니다.",
    en: "Recording your most beautiful moments forever."
  },
  artistGreeting: {
    ko: "안녕하세요, 흠입니다. 찰나의 순간을 영원으로 남겨드립니다.",
    en: "Hello, I am Heum. Capturing fleeting moments into eternity."
  },
  artistPhoto: "https://images.unsplash.com/photo-1554046920-90dc59f4e7fed?q=80&w=1200&auto=format&fit=crop",
  worksTitle: {
    ko: "포트폴리오",
    en: "Portfolio"
  },
  worksSubtitle: {
    ko: "당신의 이야기가 될 장면들",
    en: "Scenes that will become your story"
  },
  pricingTitle: {
    ko: "Pricing & Package",
    en: "Pricing & Package"
  },
  pricingSubtitle: {
    ko: "촬영 인원에 따른 추가 금액은 없습니다. (KRW 결제는 계좌이체만 가능)",
    en: "No extra charge for additional people. (KRW transfer only)"
  },
  noticeTitle: {
    ko: "유의사항",
    en: "Notice"
  },
  noticeSubtitle: {
    ko: "완벽한 결과물을 위한 약속입니다.",
    en: "Promises for perfect results."
  },
  instagramUrl: "https://www.instagram.com/heum_london/",
  kakaoUrl: "https://open.kakao.com/o/s6OR2oYh",
  collageImages: [
    "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop"
  ],
  fontTheme: 'modern',
  portfolio: [
    {
      id: 'wedding',
      title: { ko: "웨딩 스냅", en: "Wedding" },
      cover: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1507038732509-8b1a9623223a?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522673607200-1645062cd958?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518175510793-9c8dc9118b08?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1520854221256-17451cc330e7?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529634597503-139d372668e3?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=800&auto=format&fit=crop"
      ]
    },
    {
      id: 'couple',
      title: { ko: "커플 스냅", en: "Couple" },
      cover: "https://images.unsplash.com/photo-1529619768328-e37af76c6fe5?q=80&w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1529619768328-e37af76c6fe5?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550005809-91ad75fb315f?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522673607200-1645062cd958?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1621600411688-4be93cd68504?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516724562728-afc824a36e84?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519671482538-30715c3276dd?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop"
      ]
    },
    {
      id: 'solo',
      title: { ko: "개인 화보", en: "Portrait" },
      cover: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506543730435-e2c1d455b5be?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1520854221256-17451cc330e7?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1495346458844-37372ed09245?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop"
      ]
    },
    {
      id: 'event',
      title: { ko: "행사 및 졸업식", en: "Event & Graduation" },
      cover: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1627556704290-2b1f5853bf78?q=80&w=800&auto=format&fit=crop"
      ]
    }
  ],
  homePortfolioImages: [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
  ],
  faqs: [
    {
      id: 'f1',
      q: { ko: "예약은 어떻게 진행되나요?", en: "How do I book?" },
      a: { ko: "우측 하단 '예약하기'로 일정 확인 후 문의주시면, 예약금 10% 입금 시 확정됩니다. (상담 양식: 인원/날짜/시간)", en: "Check availability via 'Book Now'. Booking is confirmed with a 10% deposit." }
    },
    {
      id: 'f2',
      q: { ko: "비가 오면 어떻게 하나요?", en: "Rain Policy?" },
      a: { ko: "우천 시 상호 협의하에 날짜 변경 또는 100% 환불 가능합니다. (우중 촬영도 가능)", en: "Reschedule or 100% refund available upon agreement. Romantic rain shoots are also possible." }
    },
    {
      id: 'f3',
      q: { ko: "보정 범위가 궁금해요.", en: "Editing Scope?" },
      a: { ko: "밝기, 색감, 피부, 비율 위주의 자연스러운 보정을 지향합니다. (과도한 성형 지양)", en: "Natural retouching (tone, skin, ratio). We avoid excessive alterations." }
    },
    {
      id: 'f4',
      q: { ko: "결과물 수령 기간은요?", en: "Turnaround time?" },
      a: { ko: "원본 24시간 내, 보정본은 셀렉 후 30일 이내 제공됩니다.", en: "Originals within 24h, Retouched photos within 30 days of selection." }
    }
  ],
  // UPDATED: Reliable Jazz Track (Pixabay)
  backgroundMusicUrl: "https://cdn.pixabay.com/audio/2022/11/02/audio_65191833b7.mp3",
  meetingPoints: [
      {
          id: 'tower',
          title: { ko: '타워브릿지 미팅장소', en: 'Tower Bridge Meeting Point' },
          description: { 
              ko: "The International Brigade Memorial\n(주빌리가든스 놀이터 옆)", 
              en: "The International Brigade Memorial\n(Next to Jubilee Gardens)" 
          },
          address: "London SE1 7JA",
          googleMapUrl: "https://goo.gl/maps/exampleTower"
      },
      {
          id: 'bigben',
          title: { ko: '빅벤 미팅장소', en: 'Big Ben Meeting Point' },
          description: { 
              ko: "Westminster Station Exit 2\n(웨스트민스터 역 2번 출구 앞)", 
              en: "Westminster Station Exit 2\n(In front of Exit 2)" 
          },
          address: "London SW1A 2JR",
          googleMapUrl: "https://goo.gl/maps/exampleBigben"
      },
      {
          id: 'others',
          title: { ko: '그 외 (협의)', en: 'Other Locations' },
          description: { 
              ko: "사전 상담을 통해 결정된 장소에서 미팅을 진행합니다.\n(런던 시내, 공원, 근교 등)", 
              en: "Meeting point to be discussed via consultation.\n(Central London, Parks, Suburbs, etc.)" 
          },
          address: "London, UK",
          googleMapUrl: "https://goo.gl/maps/London"
      }
  ],
  menuItems: MENU_ITEMS,
  notices: NOTICES,
  packages: PACKAGES,
  aiContext: "촬영 장소는 주로 런던의 랜드마크에서 진행됩니다. 의상은 밝은 톤을 추천드립니다.", // Default context
  aiLogs: [], // Initialize empty logs
  aiQuickQuestions: [
      "예약은 어떻게 하나요?",
      "가격 정보를 알려주세요.",
      "비가 오면 촬영은 어떻게 되나요?",
      "보정은 어떻게 진행되나요?"
  ],
  schedule: [] // Initialize empty schedule
};

export const DEFAULT_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    email: 'guest@example.com',
    author: '민지',
    content: '런던 날씨가 흐려서 걱정했는데 작가님이 "흐린 날이 사진은 더 분위기 있어요!" 하면서 텐션 올려주셔서 진짜 즐겁게 찍었어요 ㅋㅋ 보정도 너무 과하지 않고 딱 예쁘게 해주심! 강추해요!',
    date: '2023.10.15',
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1520854221256-17451cc330e7?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507038732509-8b1a9623223a?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522673607200-1645062cd958?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=400&auto=format&fit=crop"
    ]
  },
  {
    id: 'r2',
    email: 'guest2@example.com',
    author: 'Sarah & Tom',
    content: 'Heum is simply the best! We are not models but he made us feel like stars. The photos are my favorite souvenir from London.',
    date: '2023.11.02',
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518175510793-9c8dc9118b08?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520854221256-17451cc330e7?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1529634597503-139d372668e3?q=80&w=400&auto=format&fit=crop"
    ]
  },
  {
    id: 'r3',
    email: 'guest3@example.com',
    author: '지훈이형',
    content: '와.. 진짜 대박입니다. 여자친구가 사진 까다로운 편인데 원본 받자마자 맘에 든다고 난리 났어요. 흠작가님 센스 인정! 다음에 또 갈게요 형님 ㅋㅋ',
    date: '2023.12.10',
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1623164282035-18b335607b1a?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=400&auto=format&fit=crop"
    ]
  },
  {
    id: 'r4',
    email: 'guest4@example.com',
    author: 'Emily K.',
    content: 'So happy we booked Heum! He knew all the best spots in London that weren\'t crowded. The photos turned out dreamy.',
    date: '2024.01.05',
    rating: 5,
    photos: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=400&auto=format&fit=crop"
    ]
  },
  {
    id: 'r5',
    email: 'guest5@example.com',
    author: '현우',
    content: '신혼여행 스냅 고민하다가 예약했는데 후회 없습니다. 작가님이 포즈도 잘 알려주시고 편안하게 해주셨어요.',
    date: '2024.01.20',
    rating: 5,
    photos: [
        "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400&auto=format&fit=crop"
    ]
  },
  {
    id: 'r6',
    email: 'guest6@example.com',
    author: 'Jessica',
    content: 'Amazing experience! Heum is very professional and talented. Love the vintage vibe of the photos.',
    date: '2024.02.14',
    rating: 5,
    photos: []
  }
];