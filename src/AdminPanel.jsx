import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

const ADMIN_EMAIL = 'mabofard1@gmail.com';
const categoryOptions = ['الساندوتشات', 'كريب الدجاج', 'كريب اللحوم', 'كريب الجبن', 'إضافات', 'كريبات فريش', 'مكس قرمشة', 'الجديد من قرمشة'];
const karmashaCategories = new Set(categoryOptions);
const artOptions = ['sandwiches'];

const emptyForm = {
  name: '',
  description: '',
  category: 'الساندوتشات',
  section_title: 'الساندوتشات',
  price_m: '',
  price_l: '',
  image_url: '',
  art_key: 'sandwiches',
  is_available: true
};

const isPasswordSetupLink = () =>
  /type=(invite|recovery)/.test(window.location.hash) ||
  new URLSearchParams(window.location.search).has('code');

function AdminPanel({ defaultMenu }) {
  const allowedItemKeys = new Set(defaultMenu.flatMap((section) =>
    section.items.map(([name]) => `${section.category}::${section.title}::${name}`)
  ));
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSetup, setPasswordSetup] = useState(
    isPasswordSetupLink
  );
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadItems = async () => {
    if (!supabase) return;
    const { data, error: loadError } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (loadError) {
      setError(`تعذر تحميل المنيو: ${loadError.message}. راجع أعمدة section_title و art_key و description في قاعدة البيانات.`);
      return;
    }
    setItems((data || []).filter((item) => {
      const title = item.section_title || item.category;
      return karmashaCategories.has(item.category) &&
        allowedItemKeys.has(`${item.category}::${title}::${item.name}`);
    }));
    setError('');
  };

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
      if (data.session) loadItems();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession && (_event === 'PASSWORD_RECOVERY' || isPasswordSetupLink())) {
        setPasswordSetup(true);
      }
      if (nextSession) window.setTimeout(loadItems, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    setNotice('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    setBusy(false);
    if (signInError) {
      setError(`تعذر تسجيل الدخول: ${signInError.message}`);
      return;
    }
    if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError('هذا الحساب غير مصرح له بإدارة المنيو.');
      return;
    }
    setSession(data.session);
    setPassword('');
    setNotice('تم تسجيل الدخول.');
    await loadItems();
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setItems([]);
    setSession(null);
    setNotice('تم تسجيل الخروج.');
  };

  const sendPasswordLink = async () => {
    if (!supabase) return;
    setBusy(true);
    setError('');
    setNotice('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin`
    });
    setBusy(false);
    if (resetError) {
      setError(`تعذر إرسال رابط تغيير كلمة المرور: ${resetError.message}`);
      return;
    }
    setNotice('بعتنا لك رابط تغيير كلمة المرور على بريدك.');
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (passwordError) {
      setError(`تعذر حفظ كلمة المرور: ${passwordError.message}`);
      return;
    }
    setPasswordSetup(false);
    setNewPassword('');
    window.history.replaceState({}, document.title, '/admin');
    setNotice('تم حفظ كلمة المرور.');
    await loadItems();
  };

  const saveItem = async (event) => {
    event.preventDefault();
    if (!supabase || !session) return;
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      section_title: form.section_title.trim() || form.category,
      price_m: form.price_m === '' ? null : Number(form.price_m),
      price_l: form.price_l === '' ? null : Number(form.price_l),
      image_url: form.image_url.trim() || null,
      art_key: form.art_key,
      is_available: Boolean(form.is_available),
      sort_order: editingId
        ? (items.find((item) => item.id === editingId)?.sort_order ?? items.length)
        : items.length
    };
    const request = editingId
      ? supabase.from('menu_items').update(payload).eq('id', editingId)
      : supabase.from('menu_items').insert(payload);
    const { error: saveError } = await request;
    setBusy(false);
    if (saveError) {
      setError(`تعذر حفظ الصنف: ${saveError.message}`);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setNotice(editingId ? 'تم تعديل الصنف.' : 'تمت إضافة الصنف.');
    await loadItems();
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || categoryOptions[0],
      section_title: item.section_title || item.category || '',
      price_m: item.price_m ?? item.price ?? '',
      price_l: item.price_l ?? '',
      image_url: item.image_url || '',
      art_key: item.art_key || 'coffee',
      is_available: item.is_available !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`حذف ${item.name} من المنيو؟`)) return;
    const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', item.id);
    if (deleteError) {
      setError(`تعذر حذف الصنف: ${deleteError.message}`);
      return;
    }
    setNotice('تم حذف الصنف.');
    await loadItems();
  };

  const toggleAvailability = async (item) => {
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);
    if (updateError) {
      setError(`تعذر تحديث حالة الصنف: ${updateError.message}`);
      return;
    }
    await loadItems();
  };

  const replaceMenuWithPdf = async () => {
    if (!supabase || !window.confirm('سيتم استبدال المنيو بالكامل بمحتوى PDF قرمشة، وحذف كل الأصناف والأقسام الأخرى. هل تريد المتابعة؟')) return;
    setBusy(true);
    setError('');
    const itemKey = (item) => `${item.category}::${item.section_title || item.category}::${item.name}`;
    const { data: existingRows, error: fetchError } = await supabase
      .from('menu_items')
      .select('*');
    if (fetchError) {
      setBusy(false);
      setError(`تعذر قراءة المنيو الحالية: ${fetchError.message}`);
      return;
    }

    const defaults = defaultMenu.flatMap((section) => section.items.map(([name, price_m, price_l, description]) => ({
      name,
      description: description || '',
      category: section.category,
      section_title: section.title,
      price_m,
      price_l: price_l ?? null,
      art_key: section.image,
      image_url: null,
      is_available: true,
      sort_order: 0
    })));
    const desiredKeys = new Set();
    const normalizedDefaults = defaults.filter((row) => {
      const key = itemKey(row);
      if (desiredKeys.has(key)) return false;
      desiredKeys.add(key);
      return true;
    }).map((row, index) => ({ ...row, sort_order: index }));

    const rowsByKey = new Map();
    (existingRows || []).forEach((row) => {
      const key = itemKey(row);
      if (!rowsByKey.has(key)) rowsByKey.set(key, []);
      rowsByKey.get(key).push(row);
    });

    const updates = [];
    const inserts = [];
    const keepIds = new Set();
    normalizedDefaults.forEach((row) => {
      const matches = rowsByKey.get(itemKey(row)) || [];
      const existing = matches.shift();
      if (!existing) {
        inserts.push(row);
        return;
      }
      keepIds.add(existing.id);
      updates.push(supabase.from('menu_items').update(row).eq('id', existing.id));
    });

    const updateResults = await Promise.all(updates);
    const failedUpdate = updateResults.find((result) => result.error)?.error;
    if (failedUpdate) {
      setBusy(false);
      setError(`تعذر تحديث أصناف المنيو: ${failedUpdate.message}`);
      return;
    }

    const { error: insertError } = inserts.length
      ? await supabase.from('menu_items').insert(inserts)
      : { error: null };
    if (insertError) {
      setBusy(false);
      setError(`تعذر إضافة أصناف المنيو: ${insertError.message}`);
      return;
    }

    const deleteIds = (existingRows || [])
      .filter((row) => !keepIds.has(row.id))
      .map((row) => row.id);
    const { error: deleteError } = deleteIds.length
      ? await supabase.from('menu_items').delete().in('id', deleteIds)
      : { error: null };
    setBusy(false);
    if (deleteError) {
      setError(`تم تحديث الأصناف المطلوبة، لكن تعذر حذف بعض الأصناف القديمة: ${deleteError.message}`);
      await loadItems();
      return;
    }
    setNotice(`تم استبدال المنيو بمحتوى PDF قرمشة. أُضيف ${inserts.length} صنف وتم حذف ${deleteIds.length} صنف قديم أو زائد.`);
    await loadItems();
  };

  // البحث في الأصناف
  const normalize = (value) => String(value ?? '').toLowerCase().trim();
  const query = normalize(search);
  const filteredItems = query
    ? items.filter((item) =>
        [item.name, item.description, item.category, item.section_title, item.price_m, item.price_l]
          .some((field) => normalize(field).includes(query))
      )
    : items;

  if (!supabase) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-message-card">
          <a className="admin-back-link" href="/">↙ العودة للموقع</a>
          <h1>إعداد الاتصال مطلوب</h1>
          <p>تأكد من وجود VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY في ملف .env.local، ثم أضف القيم نفسها في إعدادات Environment Variables على Vercel.</p>
        </section>
      </main>
    );
  }

  if (checkingSession) {
    return <main className="admin-shell"><section className="admin-card"><p>جارٍ التحقق من تسجيل الدخول...</p></section></main>;
  }

  if (session && passwordSetup) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-login-card">
          <span className="admin-kicker">قرمشة · ADMIN</span>
          <h1>اعمل كلمة مرور</h1>
          <p>اختار كلمة مرور لحساب إدارة المنيو.</p>
          <form className="admin-form" onSubmit={updatePassword}>
            <label>كلمة المرور الجديدة<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required autoComplete="new-password" /></label>
            <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}</button>
          </form>
          {error && <p className="admin-error" role="alert">{error}</p>}
          {notice && <p className="admin-notice" role="status">{notice}</p>}
        </section>
      </main>
    );
  }

  if (!session || session.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-login-card">
          <a className="admin-back-link" href="/">↙ العودة للموقع</a>
          <span className="admin-kicker">قرمشة · طعم يفرق</span>
          <h1>دخول الإدارة</h1>
          <p>سجّل الدخول بالبريد الذي استقبل دعوة الإدارة.</p>
          <form className="admin-form" onSubmit={signIn}>
            <label>البريد الإلكتروني<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label>
            <label>كلمة المرور<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
            <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? 'جارٍ الدخول...' : 'تسجيل الدخول'}</button>
          </form>
          <button className="admin-reset-link" type="button" onClick={sendPasswordLink} disabled={busy}>إرسال رابط إنشاء / تغيير كلمة المرور</button>
          {error && <p className="admin-error" role="alert">{error}</p>}
          {notice && <p className="admin-notice" role="status">{notice}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-dashboard">
        <header className="admin-topbar">
          <a className="admin-back-link" href="/">↙ العودة للموقع</a>
          <span className="admin-kicker">قرمشة · ADMIN</span>
          <button className="admin-secondary-button" type="button" onClick={signOut}>تسجيل الخروج</button>
        </header>

        <section className="admin-heading">
          <div><span className="admin-kicker">إدارة الكافيه</span><h1>إدارة المنيو</h1><p>أضف الأصناف وعدّل الأسعار والتوفر، والتغييرات تظهر على الموقع.</p></div>
          <span className="admin-count">{items.length} صنف</span>
        </section>

        <section className="admin-card">
          <h2>{editingId ? 'تعديل صنف' : 'إضافة صنف جديد'}</h2>
          <form className="admin-form admin-item-form" onSubmit={saveItem}>
            <label>اسم الصنف<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>وصف المكونات<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="اكتب مكونات الصنف" /></label>
            <label>القسم الرئيسي<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>عنوان مجموعة المنيو<input value={form.section_title} onChange={(event) => setForm({ ...form, section_title: event.target.value })} placeholder="مثال: Signature Hot" required /></label>
            <label>السعر M بالجنيه<input type="number" min="0" step="0.01" value={form.price_m} onChange={(event) => setForm({ ...form, price_m: event.target.value })} /></label>
            <label>السعر L بالجنيه<input type="number" min="0" step="0.01" value={form.price_l} onChange={(event) => setForm({ ...form, price_l: event.target.value })} /></label>
            <label>رابط صورة الصنف (اختياري)<input type="url" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="https://..." /></label>
            <label>رسمة القسم<select value={form.art_key} onChange={(event) => setForm({ ...form, art_key: event.target.value })}>{artOptions.map((art) => <option key={art} value={art}>{art}</option>)}</select></label>
            <label className="admin-checkbox"><input type="checkbox" checked={form.is_available} onChange={(event) => setForm({ ...form, is_available: event.target.checked })} /> الصنف متاح للطلب</label>
            <div className="admin-form-actions">
              <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الصنف'}</button>
              {editingId && <button className="admin-secondary-button" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>إلغاء</button>}
            </div>
          </form>
          {error && <p className="admin-error" role="alert">{error}</p>}
          {notice && <p className="admin-notice" role="status">{notice}</p>}
        </section>

        <section className="admin-card admin-list-card">
          <div className="admin-list-heading">
            <div><h2>أصناف المنيو</h2><p>تقدر تعدّل وصف المكونات وأسعار M وL أو تخفي صنف مؤقتًا.</p></div>
            <div className="admin-row-actions">
              <button className="admin-primary-button" type="button" onClick={replaceMenuWithPdf} disabled={busy}>{busy ? 'جارٍ استبدال المنيو...' : 'استبدال المنيو بمنيو PDF قرمشة'}</button>
              <button className="admin-secondary-button" type="button" onClick={loadItems}>تحديث القائمة</button>
            </div>
          </div>

          {items.length > 0 && (
            <input
              className="admin-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الصنف أو القسم أو السعر..."
              aria-label="بحث في الأصناف"
            />
          )}

          {!items.length ? (
            <div className="admin-empty">
              <p>قاعدة البيانات لسه مافيهاش أصناف. استخدم زر إضافة أصناف قرمشة الناقصة لإدخال المنيو.</p>
            </div>
          ) : !filteredItems.length ? (
            <div className="admin-empty"><p>مفيش أصناف مطابقة للبحث "{search}".</p></div>
          ) : (
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>الصنف</th><th>القسم</th><th>M</th><th>L</th><th>التوفر</th><th>إجراءات</th></tr></thead><tbody>
              {filteredItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong>{item.description && <small className="admin-item-description">{item.description}</small>}</td><td>{item.section_title || item.category}</td><td>{item.price_m == null ? '—' : `${item.price_m} ج.م`}</td><td>{item.price_l == null ? '—' : `${item.price_l} ج.م`}</td><td><button className={`admin-availability ${item.is_available ? 'is-available' : ''}`} type="button" onClick={() => toggleAvailability(item)}>{item.is_available ? 'متاح' : 'غير متاح'}</button></td><td><div className="admin-row-actions"><button type="button" onClick={() => editItem(item)}>تعديل</button><button type="button" className="admin-delete-button" onClick={() => deleteItem(item)}>حذف</button></div></td></tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminPanel;
