
import React, { useEffect, useMemo, useState } from 'react';
import { FaFacebookF } from 'react-icons/fa';
import { FaInstagram, FaTiktok } from 'react-icons/fa6';
import AdminPanel from './AdminPanel.jsx';
import { CartProvider } from './Cart/CartContext.jsx';
import QuantityControl from './Cart/QuantityControl.jsx';
import CartDrawer from './Cart/CartDrawer.jsx';
import Checkout from './Cart/Checkout.jsx';
import { supabase } from './supabaseClient.js';

const menu = [
  { category: 'البيتزات', title: 'البيتزات', image: 'sandwiches', items: [
    ['مكس فراخ', 130, 155], ['مكس لحوم', 130, 155], ['بسطرمة', 135, 160],
    ['مكس جبن', 130, 155], ['سجق', 130, 160], ['مشوي صدور', 130, 160],
    ['كريسبي', 130, 160], ['شيدر', 130, 160], ['وش استربس', 160, 185],
    ['مارجريتا', 125, 145], ['سوبريم', 135, 155], ['سوسيس', 125, 150],
    ['رانش', 135, 165], ['خضار', 125, 145], ['تونة', null, 175],
    ['حشو أطراف', 45, 55], ['نص ونص', null, 155]
  ]},
  { category: 'الباستات', title: 'الباستات', image: 'sandwiches', items: [
    ['مكس فراخ', 95], ['شيش طاووق', 95], ['مشوي صدور', 95],
    ['رانش (حار أو عادي)', 105], ['مكس بسطرمة', 95], ['كرانشي', 95],
    ['وش مكس', 105], ['وش زنجر', 105], ['وش بسطرمة', 105],
    ['الهامر', 115], ['السعادة', 130]
  ]},
  { category: 'كريب الدجاج', title: 'كريب الدجاج', image: 'sandwiches', items: [
    ['بانيه فريش', 90], ['شيش طاووق', 95], ['فاهيتا فراخ', 95], ['مشوي صدور', 100],
    ['سوبر كرانشي', 90], ['فرايدي', 95], ['شاورما فراخ', 95], ['زنجر قرمشة', 90],
    ['كوردن بلو', 95], ['كريسبي', 90], ['مكس قرمشة', 90], ['مكس دجاج', 90],
    ['بانيه بطاطس', 80], ['قرمشة', 90], ['مكس كيو حار', 90]
  ]},
  { category: 'كريب اللحوم', title: 'كريب اللحوم', image: 'sandwiches', items: [
    ['هوت دوج', 90], ['تشيز برجر', 90], ['سجق', 90], ['مكس لحوم', 105], ['بسطرمة', 105]
  ]},
  { category: 'كريب الجبن', title: 'كريب الجبن', image: 'sandwiches', items: [
    ['مكس جبن', 80]
  ]},
  { category: 'الإضافات', title: 'الإضافات', image: 'sandwiches', items: [
    ['باكيت بطاطس صغير', 25], ['باكيت بطاطس كبير', 40], ['بطاطس شيدر', 45],
    ['بطاطس موزاريلا', 65], ['بطاطس هالبينو', 65], ['كول سلو', 15], ['بيج كولا', 15]
  ]},
  { category: 'كريبات فريش', title: 'كريبات فريش', image: 'sandwiches', items: [
    ['كرانشيتكو', 105], ['دينامو', 105], ['الديناميت', 105], ['المطافي', 105],
    ['الكلاسيك', 105], ['الكونو', 105], ['المدمر', 105], ['حرب الفراخ', 105],
    ['باربيكيو', 105], ['بابيجي', 105], ['بانيه حلواني', 80], ['زنجر قرمشة', 90],
    ['مكس تكساس', 95], ['مكس شيدر', 95], ['مكس رانش', 95]
  ]},
  { category: 'مكس قرمشة', title: 'مكس قرمشة', image: 'sandwiches', items: [
    ['الديزل', 95], ['الوحش', 90], ['الفرحة', 90], ['الصاروخ', 90]
  ]},
  { category: 'الجديد من قرمشة', title: 'الجديد من قرمشة', image: 'sandwiches', items: [
    ['الباكبوظة', 120], ['الوصاية', 120], ['الأهرامات', 120]
  ]}
];

const menuItemKey = (category, title, name) => `${category}::${title}::${name}`;
const businessAddress = 'ميدان محمد نجيب، بجوار جنة الفواكة، كفر الزيات، محافظة الغربية، مصر';
const businessAddressQuery = encodeURIComponent(businessAddress);
const allowedMenuItemKeys = new Set(menu.flatMap((section) =>
  section.items.map(([name]) => menuItemKey(section.category, section.title, name))
));

const menuDescriptions = {
  'مكس فراخ': 'تشكيلة فراخ مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'مشوي صدور': 'شرائح صدور فراخ مشوية مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'كريسبي': 'دجاج مقرمش حار مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'وش استربس': 'استربس فراخ مقرمش مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'سوبريم': 'فراخ مع خضار وجبنة رومي وموتزاريلا وصوص مايونيز.',
  'رانش': 'فراخ مع خضار وجبنة رومي وموتزاريلا وصوص رانش.',
  'بانيني فريش': 'قطع بانيه فريش مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'بانيه فريش': 'قطع بانيه فريش مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'تشيكن طاووق': 'شيش طاووق مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'شيش طاووق': 'شيش طاووق مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'فاهيتا فراخ': 'شاورما فراخ ومشروم وخضار وجبنة رومي وموتزاريلا ومايونيز.',
  'سوبر كرانشي': 'دجاج حار مقرمش مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'فرايدي': 'دجاج مشوي ومشروم وصوص باربيكيو مع خضار وجبنة رومي وموتزاريلا.',
  'فراخ هادي': 'فراخ مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'شاورما فراخ': 'دجاج شاورما مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'زنجر قرمشة': 'زنجر فريش وجبنة شيدر وخضار وجبنة رومي وموتزاريلا ومايونيز.',
  'كوردن بلو': 'دجاج رول محشي جبن مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'مكس قرمشة': 'زنجر وكريسبي وكوردن بلو مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'مكس دجاج': 'مشوي صدور وشيش طاووق وبانيه مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'بانيني بطاطس': 'قطع بانيه وبطاطس مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'قرمشة': 'مشكل فراخ مع صوص رانش وموتزاريلا وخضار وكاتشب ومايونيز.',
  'مكس كريمي حار': 'قطع زنجر وكريسبي مع صوص شيدر ورومي وخضار وكاتشب ومايونيز.',
  'مكس كيو حار': 'قطع زنجر وكريسبي مع صوص شيدر ورومي وخضار وكاتشب ومايونيز.',
  'مكس لحوم': 'قطع كفتة وبرجر وسجق مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'بسطرمة': 'بسطرمة وسلامي مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'سجق': 'قطع سجق إسكندراني مع كاتشب ومايونيز.',
  'سوسيس': 'سوسيس مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'هوت دوج': 'شرائح هوت دوج مشوية مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'تشيدر برجر': 'برجر لحم صافي مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'تشيز برجر': 'برجر لحم صافي مع خضار وجبنة رومي وموتزاريلا ومايونيز.',
  'كرانشي': 'قطع بانيه فريش مع رومي مدخن وصوص شيدر.',
  'كرانشيتكو': 'قطع بانيه فريش مع رومي مدخن وصوص شيدر.',
  'دينامو': 'شيش طاووق واستربس فريش مع كرانشي فرايز.',
  'ديناميت': 'شيش طاووق وزنجر فريش وبسطرمة ومشروم وشيدر.',
  'الديناميت': 'شيش طاووق وزنجر فريش وبسطرمة ومشروم وشيدر.',
  'المطافي': 'صدور كرانشي واستربس فريش حار.',
  'كلاسيك': 'قطع زنجر فريش مع صوص رانش.',
  'الكلاسيك': 'قطع زنجر فريش مع صوص رانش.',
  'الكونو': 'قطع استربس فريش مع وش موتزاريلا.',
  'المدمر': 'قطع صدور كرانشي مع رومي مدخن وصوص تكساس.',
  'حرب الفراخ': 'استربس وزنجر وكرانشي فريش مع كوردن بلو.',
  'باربيكيو': 'صدور مشوية ومشروم وصوص باربيكيو.',
  'بابيجي': 'قطع بانيه فريش مع رومي مدخن وبطاطس وصوص شيدر.',
  'بانيه حلواني': 'قطع بانيه فريش مع رومي مدخن وبطاطس وصوص شيدر.',
  'مكس تكساس': 'قطع فراخ مع صوص تكساس وخضار وجبنة.',
  'مكس شيدر': 'قطع فراخ مع صوص شيدر وخضار.',
  'مكس رانش': 'قطع فراخ مع صوص رانش وخضار.',
  'مكس جبن': 'جبنة رومي وشيدر وكريمي مع خضار وموتزاريلا.',
  'شيدر': 'جبنة شيدر مع موتزاريلا وخضار.',
  'مارجريتا': 'جبنة وموتزاريلا مع صلصة طماطم.',
  'حشو أطراف': 'إضافة جبنة لحشو أطراف البيتزا.',
  'نص ونص': 'بيتزا بنصفين من اختيارين.',
  'باكيت بطاطس صغير': 'بطاطس مقلية، حجم صغير.',
  'باكيت بطاطس كبير': 'بطاطس مقلية، حجم كبير.',
  'بطاطس شيدر': 'بطاطس مقلية مع صوص شيدر.',
  'بطاطس موزاريلا': 'بطاطس مقلية مع جبنة موتزاريلا.',
  'بطاطس هالبينو': 'بطاطس مقلية مع هالبينو.',
  'كول سلو': 'سلطة كرنب وجزر بصوص كريمي.',
  'بيج كولا': 'مشروب غازي.',
  'صوص': 'إضافة صوص حسب الاختيار.',
  'الدبل': 'فراخ مفرمشة وشيش طاووق وبسطرمة وموتزاريلا وكاتشب ومايونيز وشيدر.',
  'الوحش': 'بانيه وزنجر وكريسبي وخضار وموتزاريلا وكاتشب ومايونيز وصوص شيدر.',
  'الفرحة': 'زنجر وشيدر وبطاطس ورومي وخضار وموتزاريلا وكاتشب ومايونيز.',
  'المزارع': 'بطاطس مع خضار وجبنة وصوص.',
  'الصاروخ': 'كوردن بلو وزنجر ورومي مع خضار وموتزاريلا وكاتشب ومايونيز.',
  'خضار': 'خضار طازج مع الجبنة والصلصة.',
  'تونة': 'تونة مع الخضار والجبنة والصلصة.',
  'الباكبوظة': 'مشكل فراخ وبسطرمة وموتزاريلا وستيكس وصوص رانش.',
  'الوصاية': 'فراخ فريش وكوردن بلو وسوسيس وموتزاريلا ورومي مدخن وخضار وكاتشب ومايونيز.',
  'الأهرامات': 'اسأل المطعم عن المكونات التفصيلية لهذا الصنف.'
};

const categories = ['الكل', 'البيتزات', 'الباستات', 'كريب الدجاج', 'كريب اللحوم', 'كريب الجبن', 'الإضافات', 'كريبات فريش', 'مكس قرمشة', 'الجديد من قرمشة'];

function Brand({ footer = false, onClick }) {
  return (
    <a
      className={footer ? 'footer-brand' : 'brand navbar-brand'}
      href="#home"
      aria-label="قرمشة - الرئيسية"
      onClick={onClick}
    >
      <img
        src={footer ? '/assets/karmasha-logo.png' : '/assets/karmasha-navbar.jpg'}
        alt="شعار قرمشة"
      />
    </a>
  );
}

function MenuCard({ section, term }) {
  const getDescription = (name, savedDescription) =>
    savedDescription || (section.category === 'الباستات' ? '' : menuDescriptions[name] || '');
  const items = section.items.filter(([name, , , , savedDescription]) => {
    const description = getDescription(name, savedDescription);
    return name.toLowerCase().includes(term) ||
      section.title.toLowerCase().includes(term) ||
      description.toLowerCase().includes(term);
  });

  if (!items.length) return null;

  return (
    <article className="menu-card">
      <header className="card-head">
        <div className="card-title">
          <h3>{section.title}</h3>
          <span className="card-count">{String(items.length).padStart(2, '0')} أصناف</span>
        </div>
        <MenuArt type={section.image} />
      </header>
      {items.map(([name, smallPrice, largePrice, itemId, savedDescription], itemIndex) => {
        const description = getDescription(name, savedDescription);
        const variants = [
          smallPrice != null && { size: largePrice != null ? 'M' : '', price: smallPrice },
          largePrice != null && { size: smallPrice != null ? 'L' : 'L', price: largePrice }
        ].filter(Boolean);
        return (
          <div className="menu-item" key={itemId || `${name}-${itemIndex}`}>
            <div className="menu-item-info">
              <span className="item-name">{name}</span>
              {description && <small className="item-note">{description}</small>}
            </div>
            <div className="kc-item-end kc-size-options">
              {variants.map(({ size, price }) => {
                const product = { id: itemId ? `${itemId}::${size}` : `${section.title}::${name}::${size}`, name: `${name} (${size})`, price: Number(price) };
                return (
                  <div className="kc-size-option" key={size}>
                    <span className="item-price">{size && <small>{size}</small>} {price} <small>ج.م</small></span>
                    <QuantityControl product={product} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </article>
  );
}

function MenuArt() {
  return (
    <div className="menu-photo" aria-hidden="true">
      <img src="/assets/karmasha-logo.png" alt="" />
    </div>
  );
}
function CafeSite() {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [menuSections, setMenuSections] = useState(menu);
  const [activeSection, setActiveSection] = useState('home');
  const [search, setSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const term = search.trim().toLowerCase();

  useEffect(() => {
    if (!supabase) return undefined;
    let isCurrent = true;

    supabase
      .from('menu_items')
      .select('id, name, category, section_title, price_m, price_l, description, art_key, sort_order, is_available')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const seenItems = new Set();
        const karmashaItems = (data || []).filter((row) => {
          const title = row.section_title || row.category || 'المنيو';
          const key = menuItemKey(row.category, title, row.name);
          if (!allowedMenuItemKeys.has(key) || seenItems.has(key)) return false;
          seenItems.add(key);
          return true;
        });
        if (!isCurrent) return;

        const itemsByKey = new Map(karmashaItems.map((row) => [
          menuItemKey(row.category, row.section_title || row.category, row.name), row
        ]));
        const pdfMenu = menu.map((section) => ({
          ...section,
          items: section.items.flatMap(([name, priceM, priceL]) => {
            const row = itemsByKey.get(menuItemKey(section.category, section.title, name));
            if (row?.is_available === false) return [];
            return [[
              name,
              row?.price_m ?? priceM,
              row?.price_l ?? priceL,
              row?.id,
              row?.description || (section.category === 'الباستات' ? '' : menuDescriptions[name] || '')
            ]];
          })
        }));
        setMenuSections(pdfMenu);
      });

    return () => { isCurrent = false; };
  }, []);

  const visibleSections = useMemo(
    () =>
      menuSections.filter((section) => {
        const inCategory =
          activeCategory === 'الكل' ||
          section.category === activeCategory;

        const hasMatch = section.items.some(
          ([name, , , , savedDescription]) =>
            name.toLowerCase().includes(term) ||
            section.title.toLowerCase().includes(term) ||
            (savedDescription || (section.category === 'الباستات' ? '' : menuDescriptions[name] || '')).toLowerCase().includes(term)
        );

        return inCategory && hasMatch;
      }),
    [activeCategory, term, menuSections]
  );

  const itemCount = visibleSections.reduce(
    (sum, section) =>
      sum +
      section.items.filter(
        ([name, , , , savedDescription]) =>
          name.toLowerCase().includes(term) ||
          section.title.toLowerCase().includes(term) ||
          (savedDescription || (section.category === 'الباستات' ? '' : menuDescriptions[name] || '')).toLowerCase().includes(term)
      ).length,
    0
  );

  const closeMobileNav = () => setMobileNavOpen(false);

  useEffect(() => {
    const sectionIds = ['home', 'menu', 'about', 'locations'];

    const updateActiveSection = () => {
      let current = 'home';

      for (const id of sectionIds) {
        const section = document.getElementById(id);

        if (
          section &&
          section.getBoundingClientRect().top <= window.innerHeight * 0.36
        ) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', updateActiveSection, {
      passive: true
    });

    updateActiveSection();

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
    };
  }, []);

  const handleNavClick = (section) => {
    setActiveSection(section);
    closeMobileNav();
  };

  return (
    <>
      {mobileNavOpen && (
        <div className="mobile-menu-layer">
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="إغلاق القائمة"
            onClick={closeMobileNav}
          />

          <nav className="mobile-menu-panel" aria-label="قائمة الهاتف">
            <Brand onClick={closeMobileNav} />

            <a
              className={`mobile-menu-link${activeSection === 'home' ? ' active' : ''}`}
              href="#home"
              onClick={() => handleNavClick('home')}
            >
              <span>الرئيسية</span>
              <span className="nav-arrow" aria-hidden="true">↗</span>
            </a>

            <a
              className={`mobile-menu-link${activeSection === 'menu' ? ' active' : ''}`}
              href="#menu"
              onClick={() => handleNavClick('menu')}
            >
              <span>المنيو</span>
              <span className="nav-arrow" aria-hidden="true">↗</span>
            </a>

            <a
              className={`mobile-menu-link${activeSection === 'about' ? ' active' : ''}`}
              href="#about"
              onClick={() => handleNavClick('about')}
            >
              <span>حكايتنا</span>
              <span className="nav-arrow" aria-hidden="true">↗</span>
            </a>

            <a
              className={`mobile-menu-link${activeSection === 'locations' ? ' active' : ''}`}
              href="#locations"
              onClick={() => handleNavClick('locations')}
            >
              <span>العنوان والتواصل</span>
              <span className="nav-arrow" aria-hidden="true">↗</span>
            </a>

            <a
              className="mobile-menu-view"
              href="#menu"
              onClick={() => handleNavClick('menu')}
            >
              <span>شوف المنيو</span>
            </a>

            <a
              className="mobile-menu-location"
              href="#locations"
              onClick={() => handleNavClick('locations')}
            >
              <svg className="maps-marker" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 22s8-7.3 8-13A8 8 0 1 0 4 9c0 5.7 8 13 8 13Z"
                  fill="#EA4335"
                />
                <circle cx="12" cy="9" r="3" fill="#fff" />
              </svg>
              <span>العنوان والتواصل</span>
            </a>
          </nav>
        </div>
      )}

      <header className="site-header">
        <Brand />

        <button
          className={`menu-toggle${mobileNavOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={
            mobileNavOpen ? 'إغلاق القائمة' : 'فتح القائمة'
          }
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <span></span>
          <span></span>
        </button>

        <nav className="main-nav" aria-label="القائمة الرئيسية">
          <a
            className={activeSection === 'home' ? 'active' : ''}
            href="#home"
            onClick={() => handleNavClick('home')}
          >
            الرئيسية
          </a>

          <a
            className={activeSection === 'menu' ? 'active' : ''}
            href="#menu"
            onClick={() => handleNavClick('menu')}
          >
            المنيو
          </a>

          <a
            className={activeSection === 'about' ? 'active' : ''}
            href="#about"
            onClick={() => handleNavClick('about')}
          >
            حكايتنا
          </a>

          <a
            className={activeSection === 'locations' ? 'active' : ''}
            href="#locations"
            onClick={() => handleNavClick('locations')}
          >
            العنوان والتواصل
          </a>
        </nav>

        <a className="header-cta" href="#menu">
          اختار طلبك <span>↗</span>
        </a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="eyebrow">
              <i></i> قرمشة · طعم يفرق
            </span>

            <h1>
              كل لقمة
              <br />
              لها <em>قرمشة</em>
            </h1>

            <p>
              سندوتشك المفضل، معمول بحب وبطعم يستاهل. اختار من المنيو واطلبه على مزاجك.
            </p>

            <a className="primary-button" href="#menu">
              شوف المنيو <span>↓</span>
            </a>

            <div className="hero-note">
              <span className="note-line"></span>
              <span>لقمة تفتح النفس من أول مرة</span>
            </div>
          </div>

          <div className="hero-art" aria-label="شعار قرمشة">
            <div className="art-halo"></div>
            <img src="/assets/karmasha-home.png" alt="شعار قرمشة" />
            <span className="hero-logo-caption">قرمشة<br/><b>طعم يفرق</b></span>
          </div>

          <div className="hero-bottom">
            <span>ساندوتشات · طعم أصلي · قرمشة</span>
            <span>اسحب واكتشف ↓</span>
          </div>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <i></i> اختار اللي بتحبه
              </span>

              <h2>
                منيو <em>قرمشة</em>
              </h2>
            </div>

            <p>
              اختار ساندوتشك المفضل وحدد الحجم اللي يناسبك.
            </p>
          </div>

          <div className="menu-tools">
            <div
              className="category-tabs"
              role="tablist"
              aria-label="تصنيفات المنيو"
            >
              {categories.map((category) => (
                <button
                  className={`category-tab${activeCategory === category ? ' active' : ''}`}
                  role="tab"
                  aria-selected={activeCategory === category}
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <label className="search-box">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                placeholder="دور على ساندوتش..."
                aria-label="ابحث في المنيو"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="menu-count" aria-live="polite">
            {itemCount} أصناف ·{' '}
            {activeCategory === 'الكل' ? 'كل المنيو' : activeCategory}
          </div>

          {visibleSections.length > 0 ? (
            <div className="menu-grid">
              {visibleSections.map((section) => (
                <MenuCard
                  section={section}
                  term={term}
                  key={section.title}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              مفيش صنف بالاسم ده. جرب تبحث باسم تاني.
            </div>
          )}
        </section>

        <section className="story-section" id="about">
          <div className="story-copy">
            <span className="eyebrow">
              <i></i> حكاية قرمشة
            </span>

            <h2>
              كل لقمة
              <br />
              لها <em>قرمشة</em>
            </h2>

            <p>
              في قرمشة بنهتم بكل تفصيلة، من أول اختيار المكونات لحد ما طلبك يوصلك بطعم يفتح النفس.
            </p>

            <a href="#menu" className="text-link">
              اختار ساندوتشك <span>↗</span>
            </a>
          </div>

          <div className="story-stamp">
            <span>طعم</span>
            <strong>♡</strong>
            <span>يفرق</span>
          </div>
        </section>

        <section className="locations-section" id="locations">
          <div className="locations-heading">
            <span className="eyebrow">
              <i></i> تواصل معانا
            </span>

            <h2>
              اطلب <em>اللي نفسك فيه</em>
            </h2>

            <p>
              كلمنا واطلب اللي نفسك فيه. إحنا على بُعد رسالة.
            </p>
          </div>

          <div className="locations-layout">
            <div className="locations-details">
              <article className="location-card">
                <div className="location-card-heading">
                  <span className="contact-icon pin-icon">⌖</span>

                  <div>
                    <span className="footer-label">
                      قرمشة · طعم يفرق
                    </span>
                    <h3>موقعنا
</h3>
                  </div>

                  <a className="directions-button" href={`https://www.google.com/maps/search/?api=1&query=${businessAddressQuery}`} target="_blank" rel="noreferrer">الاتجاهات <span>↗</span></a>
                </div>

                <p className="address-line">
                  {businessAddress}
                </p>
              </article>

              <article className="location-card hotline-card">
                <div className="location-card-heading">
                  <span className="contact-icon phone-icon">⌕</span>

                  <div>
                    <span className="footer-label">اتصل أو ابعتلنا</span>
                    <h3>تواصل مع قرمشة</h3>
                  </div>
                </div>

                <div className="contact-rows">
                  <div className="contact-row">
                    <div>
                      <span className="contact-type">موبايل</span>
                      <a
                        className="contact-number"
                        href="tel:+201016032853"
                      >
                        01016032853
                      </a>
                    </div>

                    <div className="contact-actions">
                      <a className="call-button" href="tel:+201016032853">
                        <span className="call-symbol">📞</span>
                        <span>اتصل بنا</span>
                      </a>

                      <a
                        className="chat-button"
                        href="https://wa.me/201016032853"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="واتساب قرمشة على 01016032853"
                      >
                        <svg
                          className="wa-symbol"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fill="currentColor"
                            d="M12.04 2a9.94 9.94 0 0 0-8.53 15.05L2.1 22l5.1-1.34A10 10 0 1 0 12.04 2Zm0 18.2a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.03.8.81-2.95-.2-.31A8.16 8.16 0 1 1 12.04 20.2Zm4.48-6.11c-.25-.13-1.47-.73-1.7-.81-.23-.09-.39-.13-.55.13-.17.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.01-.39.11-.52.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.55-1.33-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.42.06-.64.31-.22.25-.85.84-.85 2.04s.87 2.37.99 2.53c.12.17 1.72 2.63 4.16 3.69.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.59.21-1.09.15-1.19-.06-.1-.22-.16-.47-.29Z"
                          />
                        </svg>
                        <span>واتساب</span>
                      </a>
                    </div>
                  </div>


                </div>
              </article>

              <article className="location-card social-card">
                <span className="footer-label">تابعونا</span>
                <div className="karmasha-social-links">
                  <a className="karmasha-facebook-link" href="https://www.facebook.com/amr.shaban.71868" target="_blank" rel="noreferrer" aria-label="صفحة قرمشة على فيسبوك"><FaFacebookF /></a>
                  <a className="karmasha-facebook-link karmasha-instagram-link" href="https://www.instagram.com/qarmashakrip/" target="_blank" rel="noreferrer" aria-label="صفحة قرمشة على إنستجرام"><FaInstagram /></a>
                  <a className="karmasha-facebook-link karmasha-tiktok-link" href="https://www.tiktok.com/@user5272551187750" target="_blank" rel="noreferrer" aria-label="صفحة قرمشة على تيك توك"><FaTiktok /></a>
                </div>
              </article>
            </div>
            <div className="map-card karmasha-map-card">
              <iframe
                title="خريطة موقع قرمشة في كفر الزيات"
                src={`https://www.google.com/maps?q=${businessAddressQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-reference-row">
          <Brand footer />

          <nav aria-label="Footer navigation">
            <a href="#home">الرئيسية</a>
            <a href="#menu">المنيو</a>
            <a href="#locations">العنوان والتواصل</a>
          </nav>

          <a href="#home" className="footer-top-button">
            فوق تاني ↑
          </a>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal">
            <span>قرمشة · طعم يفرق</span>
            <span>
              © {new Date().getFullYear()} قرمشة. جميع الحقوق محفوظة.
            </span>
          </div>

          <a
            className="developer-credit"
            href="https://wa.me/201004365028"
            target="_blank"
            rel="noreferrer"
            aria-label="Contact Mohamed Abofard on WhatsApp"
          >
            Developed by Mohamed Abofard
          </a>
        </div>
      </footer>
    </>
  );
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/admin') {
    const adminMenu = menu.map((section) => ({
      ...section,
      items: section.items.map(([name, priceM, priceL]) => [
        name, priceM, priceL,
        section.category === 'الباستات' ? '' : menuDescriptions[name] || ''
      ])
    }));
    return <AdminPanel defaultMenu={adminMenu} />;
  }

  return (
    <CartProvider>
      {path === '/checkout' ? (
        <Checkout />
      ) : (
        <>
          <CafeSite />
          <CartDrawer />
        </>
      )}
    </CartProvider>
  );
}

export default App;

