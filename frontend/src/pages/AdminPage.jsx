import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency, getProductBadges, getProductCollectionSlugs, titleize } from '../lib/catalog';
import { parseList } from '../lib/text';
import { adminService } from '../services';
import {
  Checkbox,
  Field,
  SelectorButton,
  StatCard,
  TabButton,
  TextArea,
  TextInput,
} from '../features/admin/components';
import {
  INITIAL_COLLECTION_FORM,
  INITIAL_EDITORIAL_FORM,
  INITIAL_HOME_FORM,
  INITIAL_INFO_FORM,
  INITIAL_MERCH_FORM,
  INITIAL_PRODUCT_FORM,
} from '../features/admin/constants';
import {
  buildCollectionExportRows,
  buildHomePayloadFromMarketingRows,
  createCollectionTemplateWorkbook,
  createContentWorkbook,
  createMarketingWorkbook,
  getWorkbookLocale,
  getWorkbookRows,
  getWorkbookRowsByAliases,
  parseCollectionImportRows,
  parseContentWorkbook,
  parseMarketingWorkbook,
} from '../features/admin/excel';
import {
  buildCollectionPayload,
  buildHomePayload,
  buildInfoPayload,
  buildMerchPayload,
  buildProductExportRows,
  buildProductImportTemplateRows,
  buildProductPayload,
  buildProductPayloadsFromImportRows,
  buildSectionControlEntries,
  buildEditorialPayload,
  parseVariantRows,
  toCollectionForm,
  toEditorialForm,
  toHomeForm,
  toInfoForm,
  toMerchForm,
  toProductForm,
} from '../features/admin/transformers';
import {
  formatFileSize,
  formatOrderStatusLabel,
  formatPaymentMethod,
  ORDER_STATUS_OPTIONS,
} from '../features/admin/viewUtils';
import useCatalogStore, { getCollectionLabels } from '../store/catalogStore';
import useContentStore, { contentOptionEntries } from '../store/contentStore';
import useLanguageStore from '../store/languageStore';

export default function AdminPage() {
  const products = useCatalogStore((state) => state.products);
  const collections = useCatalogStore((state) => state.collections);
  const catalogError = useCatalogStore((state) => state.error);
  const catalogHydrated = useCatalogStore((state) => state.hydrated);
  const loadCatalog = useCatalogStore((state) => state.loadCatalog);
  const upsertProduct = useCatalogStore((state) => state.upsertProduct);
  const deleteProduct = useCatalogStore((state) => state.deleteProduct);
  const upsertCollection = useCatalogStore((state) => state.upsertCollection);
  const deleteCollection = useCatalogStore((state) => state.deleteCollection);

  const siteChrome = useContentStore((state) => state.siteChrome);
  const homePageContent = useContentStore((state) => state.homePageContent);
  const merchandisingPages = useContentStore((state) => state.merchandisingPages);
  const editorialPages = useContentStore((state) => state.editorialPages);
  const infoPages = useContentStore((state) => state.infoPages);
  const contentError = useContentStore((state) => state.error);
  const contentHydrated = useContentStore((state) => state.hydrated);
  const contentLocale = useContentStore((state) => state.locale);
  const loadContent = useContentStore((state) => state.loadContent);
  const setContentLocale = useContentStore((state) => state.setLocale);
  const updateSiteChrome = useContentStore((state) => state.updateSiteChrome);
  const updateHomePageContent = useContentStore((state) => state.updateHomePageContent);
  const updateMerchandisingPage = useContentStore((state) => state.updateMerchandisingPage);
  const updateEditorialPage = useContentStore((state) => state.updateEditorialPage);
  const updateInfoPage = useContentStore((state) => state.updateInfoPage);
  const setLanguageLocale = useLanguageStore((state) => state.setLocale);
  const storeHoldDurationLabel = siteChrome?.storeHoldDurationLabel || '24h';

  const [activeTab, setActiveTab] = useState('marketing');
  const [productPanel, setProductPanel] = useState('form');
  const [collectionPanel, setCollectionPanel] = useState('form');
  const [contentTab, setContentTab] = useState('home');
  const [selectedMerchPage, setSelectedMerchPage] = useState(contentOptionEntries.merchandising[0].key);
  const [selectedEditorialKey, setSelectedEditorialKey] = useState(
    `${contentOptionEntries.editorial[0].sectionKey}:${contentOptionEntries.editorial[0].slug}`
  );
  const [selectedInfoPage, setSelectedInfoPage] = useState(contentOptionEntries.info[0].key);

  const [productForm, setProductForm] = useState(INITIAL_PRODUCT_FORM);
  const [collectionForm, setCollectionForm] = useState(INITIAL_COLLECTION_FORM);
  const [homeForm, setHomeForm] = useState(INITIAL_HOME_FORM);
  const [merchForm, setMerchForm] = useState(INITIAL_MERCH_FORM);
  const [editorialForm, setEditorialForm] = useState(INITIAL_EDITORIAL_FORM);
  const [infoForm, setInfoForm] = useState(INITIAL_INFO_FORM);

  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCollectionSlug, setEditingCollectionSlug] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderStatusDraft, setOrderStatusDraft] = useState('pending');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingTarget, setUploadingTarget] = useState('');
  const [importingProducts, setImportingProducts] = useState(false);
  const [productImportSummary, setProductImportSummary] = useState(null);
  const [importingCollections, setImportingCollections] = useState(false);
  const [collectionImportSummary, setCollectionImportSummary] = useState(null);
  const [importingMarketing, setImportingMarketing] = useState(false);
  const [marketingImportSummary, setMarketingImportSummary] = useState(null);
  const [importingContent, setImportingContent] = useState(false);
  const [contentImportSummary, setContentImportSummary] = useState(null);
  const [imageLibrary, setImageLibrary] = useState([]);
  const [imageLibraryLoading, setImageLibraryLoading] = useState(false);
  const [imageLibraryError, setImageLibraryError] = useState('');
  const [mediaUploading, setMediaUploading] = useState(false);
  const [deletingImageName, setDeletingImageName] = useState('');
  const [showBackgroundImageLibrary, setShowBackgroundImageLibrary] = useState(false);
  const productFormRef = useRef(null);
  const productListRef = useRef(null);
  const collectionFormRef = useRef(null);
  const collectionListRef = useRef(null);

  const selectedEditorial = useMemo(() => {
    const [sectionKey, slug] = selectedEditorialKey.split(':');
    return { sectionKey, slug };
  }, [selectedEditorialKey]);

  const selectedEditorialPage = editorialPages?.[selectedEditorial.sectionKey]?.[selectedEditorial.slug];
  const selectedInfoContent = infoPages?.[selectedInfoPage];
  const selectedMerchContent = merchandisingPages?.[selectedMerchPage];
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  const loadProductImageLibrary = useCallback(async () => {
    setImageLibraryLoading(true);
    setImageLibraryError('');

    try {
      const { data } = await adminService.getProductImages({ limit: 200 });
      setImageLibrary(data || []);
    } catch (loadError) {
      setImageLibrary([]);
      setImageLibraryError(loadError?.response?.data?.detail || 'Không thể tải thư viện ảnh MinIO.');
    } finally {
      setImageLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!catalogHydrated) {
      loadCatalog();
    }
  }, [catalogHydrated, loadCatalog]);

  useEffect(() => {
    if (!contentHydrated) {
      loadContent();
    }
  }, [contentHydrated, loadContent]);

  useEffect(() => {
    setHomeForm(toHomeForm(siteChrome, homePageContent));
  }, [homePageContent, siteChrome]);

  useEffect(() => {
    setMerchForm(toMerchForm(selectedMerchContent));
  }, [selectedMerchContent]);

  useEffect(() => {
    setEditorialForm(toEditorialForm(selectedEditorialPage));
  }, [selectedEditorialPage]);

  useEffect(() => {
    setInfoForm(toInfoForm(selectedInfoContent));
  }, [selectedInfoContent]);

  useEffect(() => {
    if (!selectedOrder) return;
    if (selectedOrderId !== selectedOrder.id) {
      setSelectedOrderId(selectedOrder.id);
    }
    setOrderStatusDraft(selectedOrder.status);
  }, [selectedOrder, selectedOrderId]);

  useEffect(() => {
    if (activeTab !== 'orders') return;

    let ignore = false;

    const loadAdminOrders = async () => {
      setOrdersLoading(true);

      try {
        const { data } = await adminService.getOrders();
        if (ignore) return;
        setOrders(data || []);
      } catch (loadError) {
        if (!ignore) {
          setOrders([]);
          setError(loadError?.response?.data?.detail || 'Không thể tải danh sách đơn hàng.');
        }
      } finally {
        if (!ignore) setOrdersLoading(false);
      }
    };

    loadAdminOrders();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'products' && activeTab !== 'media') return;
    loadProductImageLibrary();
  }, [activeTab, loadProductImageLibrary]);

  const imagePreviews = useMemo(() => {
    const images = [productForm.coverImage, ...parseList(productForm.images)].filter(Boolean);
    return [...new Set(images)];
  }, [productForm.coverImage, productForm.images]);

  const variantPreview = useMemo(() => parseVariantRows(productForm.variants), [productForm.variants]);

  const collectionProductCount = useMemo(
    () =>
      collections.reduce(
        (acc, collection) => ({
          ...acc,
          [collection.slug]: products.filter((product) => getProductCollectionSlugs(product).includes(collection.slug)).length,
        }),
        {}
      ),
    [collections, products]
  );

  const homeSectionEntries = useMemo(
    () => buildSectionControlEntries(homePageContent?.sectionControls),
    [homePageContent?.sectionControls]
  );

  const marketingAudit = useMemo(() => {
    const campaignCount = contentOptionEntries.editorial.filter(
      (entry) => editorialPages?.[entry.sectionKey]?.[entry.slug]?.title
    ).length;
    const checks = [
      {
        label: 'Hero có thông điệp và CTA chính',
        ok: Boolean(homePageContent?.hero?.title && homePageContent?.hero?.description && homePageContent?.hero?.primaryCtaTo),
        detail: homePageContent?.hero?.primaryCtaTo || 'Thiếu CTA chính',
      },
      {
        label: 'Campaign banner đã nối landing page',
        ok: Boolean(homePageContent?.campaignBanner?.title && homePageContent?.campaignBanner?.to),
        detail: homePageContent?.campaignBanner?.to || 'Thiếu link campaign',
      },
      {
        label: 'Social proof đủ để tăng niềm tin',
        ok: (homePageContent?.reviews || []).length >= 3,
        detail: `${(homePageContent?.reviews || []).length} review`,
      },
      {
        label: 'UGC/social content có ảnh',
        ok: (homePageContent?.ugcPosts || []).filter((post) => post.image).length >= 2,
        detail: `${(homePageContent?.ugcPosts || []).length} bài UGC`,
      },
      {
        label: 'Newsletter có lời mời đăng ký',
        ok: Boolean(homePageContent?.newsletter?.title && homePageContent?.newsletter?.description),
        detail: homePageContent?.newsletter?.eyebrow || 'Newsletter',
      },
      {
        label: 'Có ít nhất 3 landing editorial',
        ok: campaignCount >= 3,
        detail: `${campaignCount} landing/story`,
      },
      {
        label: 'Nguồn sản phẩm hỗ trợ campaign',
        ok: products.some((product) => product.isNew || product.isBestSeller || product.isOnSale),
        detail: `${products.filter((product) => product.isNew).length} mới, ${products.filter((product) => product.isBestSeller).length} bán chạy`,
      },
    ];

    const passed = checks.filter((item) => item.ok).length;
    return {
      checks,
      passed,
      total: checks.length,
      score: Math.round((passed / checks.length) * 100),
    };
  }, [editorialPages, homePageContent, products]);

  const marketingCtas = useMemo(
    () =>
      [
        {
          label: 'Hero CTA chính',
          text: homePageContent?.hero?.primaryCtaLabel,
          to: homePageContent?.hero?.primaryCtaTo,
        },
        {
          label: 'Hero CTA phụ',
          text: homePageContent?.hero?.secondaryCtaLabel,
          to: homePageContent?.hero?.secondaryCtaTo,
        },
        {
          label: 'Campaign banner',
          text: homePageContent?.campaignBanner?.ctaLabel,
          to: homePageContent?.campaignBanner?.to,
        },
        ...homeSectionEntries
          .filter((entry) => entry.ctaLabel || entry.ctaTo)
          .map((entry) => ({
            label: entry.label,
            text: entry.ctaLabel,
            to: entry.ctaTo,
          })),
      ].filter((entry) => entry.text || entry.to),
    [homePageContent, homeSectionEntries]
  );

  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      totalCollections: collections.length,
      activeProducts: products.filter((product) => product.status !== 'draft').length,
      draftProducts: products.filter((product) => product.status === 'draft').length,
      contentPages:
        1 +
        contentOptionEntries.merchandising.length +
        contentOptionEntries.editorial.length +
        contentOptionEntries.info.length,
      saleProducts: products.filter((product) => product.isOnSale).length,
      imageAssets: imageLibrary.length,
      marketingScore: `${marketingAudit.passed}/${marketingAudit.total}`,
    }),
    [products, collections.length, imageLibrary.length, marketingAudit]
  );

  const clearFeedback = () => {
    setError('');
    setSuccessMessage('');
    setProductImportSummary(null);
    setCollectionImportSummary(null);
    setMarketingImportSummary(null);
    setContentImportSummary(null);
  };

  const scrollToRef = (ref) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFormFieldChange = (setter) => (event) => {
    const { name, value, type, checked, multiple, selectedOptions } = event.target;
    setter((prev) => ({
      ...prev,
      [name]: multiple ? Array.from(selectedOptions).map((option) => option.value) : type === 'checkbox' ? checked : value,
    }));
  };

  const handleContentLocaleChange = (locale) => {
    clearFeedback();
    setLanguageLocale(locale);
    setContentLocale(locale);
  };

  const handleUploadProductImages = async (event, target = 'gallery') => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    clearFeedback();
    setUploadingTarget(target);

    try {
      const uploads = [];
      for (const file of files) {
        const { data } = await adminService.uploadProductImage(file);
        uploads.push(data.url);
      }

      setProductForm((prev) => {
        const currentImages = parseList(prev.images);
        const nextImages = target === 'cover' ? currentImages : [...currentImages, ...uploads];

        return {
          ...prev,
          coverImage: target === 'cover' ? uploads[0] || prev.coverImage : prev.coverImage || uploads[0] || '',
          images: target === 'cover' ? prev.images : nextImages.join('\n'),
        };
      });

      setSuccessMessage(
        target === 'cover'
          ? 'Đã upload ảnh cover.'
          : `Đã upload ${uploads.length} ảnh vào gallery.`
      );
      await loadProductImageLibrary();
    } catch (uploadError) {
      setError(uploadError.response?.data?.detail || 'Không thể upload ảnh sản phẩm.');
    } finally {
      setUploadingTarget('');
      event.target.value = '';
    }
  };

  const handleSelectProductImage = (url, target = 'gallery') => {
    if (!url) return;
    clearFeedback();

    setProductForm((prev) => {
      if (target === 'cover') {
        return {
          ...prev,
          coverImage: url,
        };
      }

      const currentImages = parseList(prev.images);
      const nextImages = currentImages.includes(url) ? currentImages : [...currentImages, url];

      return {
        ...prev,
        coverImage: prev.coverImage || url,
        images: nextImages.join('\n'),
      };
    });

    setSuccessMessage(target === 'cover' ? 'Đã chọn ảnh cover từ thư viện.' : 'Đã thêm ảnh vào gallery.');
  };

  const handleRemoveProductFormImage = (url) => {
    if (!url) return;
    clearFeedback();

    setProductForm((prev) => {
      const currentImages = parseList(prev.images);
      const nextImages = currentImages.filter((image) => image !== url);
      const isCover = prev.coverImage === url;

      return {
        ...prev,
        coverImage: isCover ? nextImages[0] || '' : prev.coverImage,
        images: nextImages.join('\n'),
      };
    });

    setSuccessMessage('Đã bỏ ảnh khỏi form sản phẩm. Bấm lưu để áp dụng thay đổi.');
  };

  const handleUseImageInProductForm = (url, target = 'gallery') => {
    setActiveTab('products');
    setProductPanel('form');
    handleSelectProductImage(url, target);
    setTimeout(() => scrollToRef(productFormRef), 0);
  };

  const handleOpenBackgroundImageLibrary = async () => {
    clearFeedback();
    setShowBackgroundImageLibrary((current) => !current);
    if (!imageLibrary.length && !imageLibraryLoading) {
      await loadProductImageLibrary();
    }
  };

  const handleSelectBackgroundImage = (url) => {
    if (!url) return;
    clearFeedback();
    setHomeForm((prev) => ({
      ...prev,
      backgroundImage: url,
    }));
    setShowBackgroundImageLibrary(false);
    setSuccessMessage('Đã chọn ảnh nền từ kho MinIO. Bấm lưu để áp dụng cho website.');
  };

  const handleUploadMediaImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    clearFeedback();
    setMediaUploading(true);

    try {
      for (const file of files) {
        await adminService.uploadProductImage(file);
      }

      await loadProductImageLibrary();
      setSuccessMessage(`Đã upload ${files.length} ảnh vào kho MinIO.`);
    } catch (uploadError) {
      setError(uploadError.response?.data?.detail || 'Không thể upload ảnh vào kho MinIO.');
    } finally {
      setMediaUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteProductImage = async (image) => {
    if (!image?.object_name) return;

    const confirmed = window.confirm(`Xóa ảnh "${image.object_name}" khỏi MinIO?`);
    if (!confirmed) return;

    clearFeedback();
    setDeletingImageName(image.object_name);

    try {
      await adminService.deleteProductImage(image.object_name);
      setImageLibrary((current) => current.filter((entry) => entry.object_name !== image.object_name));
      setProductForm((prev) => ({
        ...prev,
        coverImage: prev.coverImage === image.url ? '' : prev.coverImage,
        images: parseList(prev.images).filter((url) => url !== image.url).join('\n'),
      }));
      setSuccessMessage('Đã xóa ảnh khỏi MinIO.');
    } catch (deleteError) {
      setError(deleteError.response?.data?.detail || 'Không thể xóa ảnh khỏi MinIO.');
    } finally {
      setDeletingImageName('');
    }
  };

  const resetProductForm = () => {
    setProductForm(INITIAL_PRODUCT_FORM);
    setEditingProductId(null);
    setProductPanel('form');
  };

  const resetCollectionForm = () => {
    setCollectionForm(INITIAL_COLLECTION_FORM);
    setEditingCollectionSlug(null);
    setCollectionPanel('form');
  };

  const handleEditProduct = (product) => {
    clearFeedback();
    setActiveTab('products');
    setProductPanel('form');
    setEditingProductId(product.id);
    setProductForm(toProductForm(product));
    setTimeout(() => scrollToRef(productFormRef), 0);
  };

  const handleEditCollection = (collection) => {
    clearFeedback();
    setActiveTab('collections');
    setCollectionPanel('form');
    setEditingCollectionSlug(collection.slug);
    setCollectionForm(toCollectionForm(collection));
    setTimeout(() => scrollToRef(collectionFormRef), 0);
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    clearFeedback();

    const result = await upsertProduct(buildProductPayload(productForm), editingProductId);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccessMessage(
      editingProductId ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm mới.'
    );
    resetProductForm();
  };

  const handleImportProducts = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearFeedback();
    setImportingProducts(true);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const firstSheetName = workbook.SheetNames[0];
      const rows = firstSheetName
        ? XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '', raw: false })
        : [];

      if (!rows.length) {
        setError('File import không có dòng sản phẩm nào.');
        return;
      }

      const importedProducts = buildProductPayloadsFromImportRows(rows, collections);
      const productIdsBySlug = new Map(products.map((product) => [product.slug, product.id]));
      const knownCollectionSlugs = new Set(collections.map((collection) => collection.slug));
      const summary = {
        total: rows.length,
        products: importedProducts.length,
        created: 0,
        updated: 0,
        skipped: 0,
        autoCollections: 0,
        errors: [],
      };

      for (const slug of [...new Set(importedProducts.flatMap((payload) => payload.collectionSlugs || []).filter(Boolean))]) {
        if (knownCollectionSlugs.has(slug)) continue;

        const result = await upsertCollection(
          {
            slug,
            title: titleize(slug),
            description: '',
            image: '',
            featuredKeywords: [],
            seoHeading: '',
            seoBody: '',
            sortPriority: collections.length + summary.autoCollections + 1,
            isActive: true,
            translations: {
              en: {
                title: titleize(slug),
                description: '',
                seoHeading: '',
                seoBody: '',
              },
            },
          },
          null
        );

        if (!result.ok) {
          summary.errors.push(`Không thể tự tạo danh mục "${slug}": ${result.error}`);
          continue;
        }

        knownCollectionSlugs.add(result.collection.slug);
        summary.autoCollections += 1;
      }

      for (const payload of importedProducts) {
        const rowLabel = `Dòng ${(payload._rowNumbers || []).join(', ')}`;

        if (!payload.name) {
          summary.skipped += 1;
          summary.errors.push(`${rowLabel}: thiếu tên sản phẩm.`);
          continue;
        }

        if (!payload.slug) {
          summary.skipped += 1;
          summary.errors.push(`${rowLabel}: không tạo được slug.`);
          continue;
        }

        if (!payload.collectionSlugs.length) {
          summary.skipped += 1;
          summary.errors.push(`${rowLabel}: danh mục chưa nhập.`);
          continue;
        }

        if (payload.collectionSlugs.some((slug) => !knownCollectionSlugs.has(slug))) {
          summary.skipped += 1;
          summary.errors.push(`${rowLabel}: có danh mục chưa tạo được trên backend.`);
          continue;
        }

        const existingId = productIdsBySlug.get(payload.slug) || null;
        const { _rowNumbers, ...productPayload } = payload;
        const result = await upsertProduct(productPayload, existingId);

        if (!result.ok) {
          summary.skipped += 1;
          summary.errors.push(`${rowLabel}: ${result.error}`);
          continue;
        }

        if (existingId) {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }
        productIdsBySlug.set(payload.slug, result.product.id);
      }

      setProductImportSummary(summary);
      setSuccessMessage(
        `Import xong ${summary.products} sản phẩm từ ${summary.total} dòng: tạo ${summary.created}, cập nhật ${summary.updated}, bỏ qua ${summary.skipped}, tự tạo ${summary.autoCollections} danh mục.`
      );
      resetProductForm();
    } catch (importError) {
      setError(importError?.message || 'Không thể đọc file Excel/CSV.');
    } finally {
      setImportingProducts(false);
      event.target.value = '';
    }
  };

  const handleDownloadProductImportTemplate = async () => {
    clearFeedback();

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const productRows = buildProductImportTemplateRows(collections);
      const productSheet = XLSX.utils.json_to_sheet(productRows);
      productSheet['!cols'] = [
        { wch: 28 },
        { wch: 24 },
        { wch: 18 },
        { wch: 14 },
        { wch: 32 },
        { wch: 14 },
        { wch: 14 },
        { wch: 58 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 46 },
        { wch: 18 },
        { wch: 32 },
        { wch: 24 },
        { wch: 32 },
        { wch: 42 },
      ];
      XLSX.utils.book_append_sheet(workbook, productSheet, 'San pham');

      const collectionSheet = XLSX.utils.json_to_sheet(
        collections.map((collection) => ({
          Slug: collection.slug,
          'Tên danh mục': collection.title,
          'Đang hiển thị': collection.isActive === false ? 'Không' : 'Có',
        }))
      );
      collectionSheet['!cols'] = [{ wch: 28 }, { wch: 36 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(workbook, collectionSheet, 'Danh muc tham khao');

      const guideSheet = XLSX.utils.aoa_to_sheet([
        ['Hướng dẫn'],
        ['Các cột bắt buộc: Tên sản phẩm, Danh mục, Giá bán.'],
        ['Mỗi dòng là một sản phẩm. Admin có thể thêm nhiều dòng để import hàng loạt.'],
        ['Nếu nhiều dòng có cùng Slug, hệ thống sẽ gộp thành một sản phẩm và gom các biến thể.'],
        ['Danh mục có thể nhập slug hoặc tên danh mục. Nhiều danh mục ngăn cách bằng dấu phẩy.'],
        ['Có thể bỏ trống Ảnh cover và Ảnh, sau đó bổ sung ảnh trong admin.'],
        ['Nếu không nhập Biến thể, hệ thống dùng Tồn kho, Kích cỡ, Màu để tạo một biến thể mặc định.'],
        ['Nếu Slug trùng sản phẩm đang có, import sẽ cập nhật sản phẩm đó.'],
      ]);
      guideSheet['!cols'] = [{ wch: 96 }];
      XLSX.utils.book_append_sheet(workbook, guideSheet, 'Huong dan');

      XLSX.writeFile(workbook, 'product-import-template.xlsx');
    } catch (templateError) {
      setError(templateError?.message || 'Không thể tạo template Excel.');
    }
  };

  const handleExportProductsToExcel = async () => {
    clearFeedback();

    if (!products.length) {
      setError('Chưa có sản phẩm nào để xuất file.');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const productSheet = XLSX.utils.json_to_sheet(buildProductExportRows(products));
      productSheet['!cols'] = [
        { wch: 30 },
        { wch: 28 },
        { wch: 18 },
        { wch: 14 },
        { wch: 36 },
        { wch: 14 },
        { wch: 14 },
        { wch: 64 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 52 },
        { wch: 18 },
        { wch: 32 },
        { wch: 28 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 16 },
        { wch: 32 },
        { wch: 52 },
      ];
      XLSX.utils.book_append_sheet(workbook, productSheet, 'San pham hien tai');

      const collectionSheet = XLSX.utils.json_to_sheet(
        collections.map((collection) => ({
          Slug: collection.slug,
          'Tên danh mục': collection.title,
          'Đang hiển thị': collection.isActive === false ? 'Không' : 'Có',
        }))
      );
      collectionSheet['!cols'] = [{ wch: 28 }, { wch: 36 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(workbook, collectionSheet, 'Danh muc tham khao');

      XLSX.writeFile(workbook, `products-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setSuccessMessage(`Đã xuất ${products.length} sản phẩm ra Excel, không bao gồm ảnh.`);
    } catch (exportError) {
      setError(exportError?.message || 'Không thể xuất file Excel sản phẩm.');
    }
  };

  const handleDownloadCollectionImportTemplate = async () => {
    clearFeedback();

    try {
      const XLSX = await import('xlsx');
      const workbook = createCollectionTemplateWorkbook(XLSX, collections);
      XLSX.writeFile(workbook, 'collection-import-template.xlsx');
    } catch (templateError) {
      setError(templateError?.message || 'Không thể tạo template Excel danh mục.');
    }
  };

  const handleExportCollectionsToExcel = async () => {
    clearFeedback();

    if (!collections.length) {
      setError('Chưa có danh mục nào để xuất file.');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const collectionRows = buildCollectionExportRows(collections);
      const collectionSheet = XLSX.utils.json_to_sheet(collectionRows);
      collectionSheet['!cols'] = [16, 24, 28, 52, 42, 26, 28, 48, 28, 48, 28, 48, 12, 14].map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(workbook, collectionSheet, 'Danh muc hien tai');
      XLSX.writeFile(workbook, `collections-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setSuccessMessage(`Đã xuất ${collections.length} danh mục ra Excel.`);
    } catch (exportError) {
      setError(exportError?.message || 'Không thể xuất Excel danh mục.');
    }
  };

  const handleImportCollections = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearFeedback();
    setImportingCollections(true);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const rows = getWorkbookRowsByAliases(XLSX, workbook, ['Danh muc', 'Danh muc hien tai']);

      if (!rows.length) {
        setError('File import không có dữ liệu danh mục hợp lệ.');
        return;
      }

      const importedCollections = parseCollectionImportRows(rows);
      const existingBySlug = new Map(collections.map((collection) => [collection.slug, collection]));
      const summary = {
        total: rows.length,
        collections: importedCollections.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

      for (const payload of importedCollections) {
        const rowLabel = `Dòng ${(payload._rowNumbers || []).join(', ')}`;

        if (!payload.title) {
          summary.skipped += 1;
          summary.errors.push(`${rowLabel}: thiếu tên danh mục.`);
          continue;
        }

        if (!payload.slug) {
          summary.skipped += 1;
          summary.errors.push(`${rowLabel}: thiếu slug.`);
          continue;
        }

        const previousSlug = payload._previousSlug && existingBySlug.has(payload._previousSlug)
          ? payload._previousSlug
          : existingBySlug.has(payload.slug)
            ? payload.slug
            : null;
        const { _rowNumbers, _previousSlug, ...collectionPayload } = payload;
        const result = await upsertCollection(collectionPayload, previousSlug);

        if (!result.ok) {
          summary.skipped += 1;
          summary.errors.push(`${rowLabel}: ${result.error}`);
          continue;
        }

        if (previousSlug) {
          summary.updated += 1;
          existingBySlug.delete(previousSlug);
        } else {
          summary.created += 1;
        }
        existingBySlug.set(result.collection.slug, result.collection);
      }

      setCollectionImportSummary(summary);
      setSuccessMessage(
        `Import xong ${summary.collections} danh mục từ ${summary.total} dòng: tạo ${summary.created}, cập nhật ${summary.updated}, bỏ qua ${summary.skipped}.`
      );
      resetCollectionForm();
    } catch (importError) {
      setError(importError?.message || 'Không thể đọc file Excel danh mục.');
    } finally {
      setImportingCollections(false);
      event.target.value = '';
    }
  };

  const handleDownloadMarketingTemplate = async () => {
    clearFeedback();

    try {
      const XLSX = await import('xlsx');
      const workbook = createMarketingWorkbook(XLSX, {
        homeForm,
        marketingAudit,
        marketingCtas,
        locale: contentLocale,
      });
      XLSX.writeFile(workbook, `marketing-monitor-template-${contentLocale}.xlsx`);
    } catch (templateError) {
      setError(templateError?.message || 'Không thể tạo template Excel marketing.');
    }
  };

  const handleExportMarketingToExcel = async () => {
    clearFeedback();

    try {
      const XLSX = await import('xlsx');
      const workbook = createMarketingWorkbook(XLSX, {
        homeForm,
        marketingAudit,
        marketingCtas,
        locale: contentLocale,
      });
      XLSX.writeFile(workbook, `marketing-monitor-export-${contentLocale}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setSuccessMessage(`Đã xuất Marketing Monitor cho locale ${contentLocale.toUpperCase()}.`);
    } catch (exportError) {
      setError(exportError?.message || 'Không thể xuất Excel marketing.');
    }
  };

  const handleImportMarketing = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearFeedback();
    setImportingMarketing(true);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const importLocale = getWorkbookLocale(XLSX, workbook, contentLocale);
      const rows = getWorkbookRowsByAliases(XLSX, workbook, ['Marketing Input', 'Home & Site']);

      if (!rows.length) {
        setError('File import không có dữ liệu marketing hợp lệ.');
        return;
      }

      if (importLocale !== contentLocale) {
        setLanguageLocale(importLocale);
        setContentLocale(importLocale);
      }

      const payload = buildHomePayloadFromMarketingRows(rows);
      const chromeResult = await updateSiteChrome(payload.siteChrome);
      if (!chromeResult.ok) {
        setError(chromeResult.error);
        return;
      }

      const homeResult = await updateHomePageContent(payload.homePageContent);
      if (!homeResult.ok) {
        setError(homeResult.error);
        return;
      }

      const importedHomeForm = parseMarketingWorkbook(rows);
      setHomeForm(importedHomeForm);
      setMarketingImportSummary({
        locale: importLocale,
        rows: rows.length,
        updatedSections: ['siteChrome', 'homePageContent'],
      });
      setSuccessMessage(`Đã import Marketing Monitor cho locale ${importLocale.toUpperCase()}.`);
    } catch (importError) {
      setError(importError?.message || 'Không thể import file Excel marketing.');
    } finally {
      setImportingMarketing(false);
      event.target.value = '';
    }
  };

  const handleDownloadContentTemplate = async () => {
    clearFeedback();

    try {
      const XLSX = await import('xlsx');
      const workbook = createContentWorkbook(XLSX, {
        siteChrome,
        homePageContent,
        merchandisingPages,
        editorialPages,
        infoPages,
        locale: contentLocale,
        contentOptions: contentOptionEntries,
      });
      XLSX.writeFile(workbook, `content-template-${contentLocale}.xlsx`);
    } catch (templateError) {
      setError(templateError?.message || 'Không thể tạo template Excel nội dung.');
    }
  };

  const handleExportContentToExcel = async () => {
    clearFeedback();

    try {
      const XLSX = await import('xlsx');
      const workbook = createContentWorkbook(XLSX, {
        siteChrome,
        homePageContent,
        merchandisingPages,
        editorialPages,
        infoPages,
        locale: contentLocale,
        contentOptions: contentOptionEntries,
      });
      XLSX.writeFile(workbook, `content-export-${contentLocale}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setSuccessMessage(`Đã xuất toàn bộ content cho locale ${contentLocale.toUpperCase()}.`);
    } catch (exportError) {
      setError(exportError?.message || 'Không thể xuất Excel nội dung.');
    }
  };

  const handleImportContent = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearFeedback();
    setImportingContent(true);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const importLocale = getWorkbookLocale(XLSX, workbook, contentLocale);
      const homeRows = getWorkbookRowsByAliases(XLSX, workbook, ['Home & Site', 'Marketing Input']);
      const merchandisingRows = getWorkbookRowsByAliases(XLSX, workbook, ['Merchandising']);
      const editorialRows = getWorkbookRowsByAliases(XLSX, workbook, ['Editorial']);
      const infoRows = getWorkbookRowsByAliases(XLSX, workbook, ['Info Pages']);

      if (!homeRows.length) {
        setError('File import content thiếu dữ liệu phần Home & Site.');
        return;
      }

      const parsed = parseContentWorkbook({
        homeRows,
        merchandisingRows,
        editorialRows,
        infoRows,
      });

      if (importLocale !== contentLocale) {
        setLanguageLocale(importLocale);
        setContentLocale(importLocale);
      }

      const summary = {
        locale: importLocale,
        home: 0,
        merchandising: 0,
        editorial: 0,
        info: 0,
        skipped: 0,
        errors: [],
      };

      const homePayload = buildHomePayload(parsed.homeForm);
      const chromeResult = await updateSiteChrome(homePayload.siteChrome);
      if (!chromeResult.ok) {
        setError(chromeResult.error);
        return;
      }
      const homeResult = await updateHomePageContent(homePayload.homePageContent);
      if (!homeResult.ok) {
        setError(homeResult.error);
        return;
      }
      summary.home = 1;

      for (const entry of parsed.merchandising) {
        if (!entry.key) {
          summary.skipped += 1;
          summary.errors.push('Merchandising: có dòng thiếu key.');
          continue;
        }

        const result = await updateMerchandisingPage(entry.key, entry.payload);
        if (!result.ok) {
          summary.skipped += 1;
          summary.errors.push(`Merchandising ${entry.key}: ${result.error}`);
          continue;
        }
        summary.merchandising += 1;
      }

      for (const entry of parsed.editorial) {
        if (!entry.sectionKey || !entry.slug) {
          summary.skipped += 1;
          summary.errors.push('Editorial: có dòng thiếu section hoặc slug.');
          continue;
        }

        const result = await updateEditorialPage(entry.sectionKey, entry.slug, entry.payload);
        if (!result.ok) {
          summary.skipped += 1;
          summary.errors.push(`Editorial ${entry.sectionKey}/${entry.slug}: ${result.error}`);
          continue;
        }
        summary.editorial += 1;
      }

      for (const entry of parsed.info) {
        if (!entry.key) {
          summary.skipped += 1;
          summary.errors.push('Info Pages: có dòng thiếu key.');
          continue;
        }

        const result = await updateInfoPage(entry.key, entry.payload);
        if (!result.ok) {
          summary.skipped += 1;
          summary.errors.push(`Info ${entry.key}: ${result.error}`);
          continue;
        }
        summary.info += 1;
      }

      setContentImportSummary(summary);
      setSuccessMessage(
        `Đã import content ${importLocale.toUpperCase()}: home ${summary.home}, merchandising ${summary.merchandising}, editorial ${summary.editorial}, info ${summary.info}, bỏ qua ${summary.skipped}.`
      );
    } catch (importError) {
      setError(importError?.message || 'Không thể import file Excel nội dung.');
    } finally {
      setImportingContent(false);
      event.target.value = '';
    }
  };

  const handleSubmitCollection = async (event) => {
    event.preventDefault();
    clearFeedback();

    const result = await upsertCollection(buildCollectionPayload(collectionForm), editingCollectionSlug);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccessMessage(
      editingCollectionSlug ? 'Đã cập nhật danh mục.' : 'Đã tạo danh mục mới.'
    );
    resetCollectionForm();
  };

  const handleSubmitHomeContent = async (event) => {
    event.preventDefault();
    clearFeedback();

    const payload = buildHomePayload(homeForm);
    const chromeResult = await updateSiteChrome(payload.siteChrome);
    if (!chromeResult.ok) {
      setError(chromeResult.error);
      return;
    }

    const homeResult = await updateHomePageContent(payload.homePageContent);
    if (!homeResult.ok) {
      setError(homeResult.error);
      return;
    }

    setSuccessMessage(
      'Đã cập nhật text trang chủ và nội dung khung site.'
    );
  };

  const handleSubmitMerchContent = async (event) => {
    event.preventDefault();
    clearFeedback();
    const result = await updateMerchandisingPage(selectedMerchPage, buildMerchPayload(merchForm));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccessMessage(
      'Đã cập nhật landing page bán hàng.'
    );
  };

  const handleSubmitEditorialContent = async (event) => {
    event.preventDefault();
    clearFeedback();
    const result = await updateEditorialPage(
      selectedEditorial.sectionKey,
      selectedEditorial.slug,
      buildEditorialPayload(editorialForm)
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccessMessage(
      'Đã cập nhật bài editorial/landing page.'
    );
  };

  const handleSubmitInfoContent = async (event) => {
    event.preventDefault();
    clearFeedback();
    const result = await updateInfoPage(selectedInfoPage, buildInfoPayload(infoForm));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccessMessage(
      'Đã cập nhật nội dung trang thông tin.'
    );
  };

  const handleDeleteProduct = async (productId, productName) => {
    clearFeedback();
    if (!window.confirm(`Xóa sản phẩm "${productName}"?`)) return;

    const result = await deleteProduct(productId);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingProductId === productId) resetProductForm();
    setSuccessMessage('Đã xóa sản phẩm.');
  };

  const handleDeleteCollection = async (slug, title) => {
    clearFeedback();
    if (!window.confirm(`Xóa danh mục "${title}"?`)) return;

    const result = await deleteCollection(slug);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingCollectionSlug === slug) resetCollectionForm();
    setSuccessMessage('Đã xóa danh mục.');
  };

  const handleReloadOrders = async () => {
    clearFeedback();
    setOrdersLoading(true);

    try {
      const { data } = await adminService.getOrders();
      setOrders(data || []);
    } catch (loadError) {
      setError(loadError?.response?.data?.detail || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    clearFeedback();

    try {
      const { data } = await adminService.updateOrderStatus(selectedOrder.id, orderStatusDraft);
      setOrders((current) => current.map((order) => (order.id === selectedOrder.id ? data : order)));
      setSuccessMessage(`Đã cập nhật trạng thái đơn ${data.orderNumber} sang "${formatOrderStatusLabel(data.status)}".`);
    } catch (updateError) {
      setError(updateError?.response?.data?.detail || 'Không thể cập nhật trạng thái đơn hàng.');
    }
  };

  return (
    <div className="space-y-8 py-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-black/30 px-6 py-8 shadow-sm backdrop-blur-[2px] sm:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/10" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">Admin CMS</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-white">Marketing CMS và vận hành nội dung</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/90">
            Theo dõi sức khỏe landing page, điều phối campaign, cập nhật nội dung, quản lý ảnh, sản phẩm và đơn hàng tại một nơi.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {catalogError ? (
        <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {catalogError}
        </div>
      ) : null}

      {contentError ? (
        <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {contentError}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-7">
        <StatCard label="Marketing score" value={stats.marketingScore} hint={`${marketingAudit.score}% checklist landing page.`} />
        <StatCard label="Tổng sản phẩm" value={stats.totalProducts} hint="Toàn bộ sản phẩm đang quản lý." />
        <StatCard label="Tổng danh mục" value={stats.totalCollections} hint="Danh mục public và collection pages." />
        <StatCard label="Đang public" value={stats.activeProducts} hint="Sản phẩm hiện ngoài storefront." />
        <StatCard label="Bản nháp" value={stats.draftProducts} hint="Sản phẩm đang ẩn khỏi public." />
        <StatCard label="Trang nội dung" value={stats.contentPages} hint="Trang chủ, landing page và trang hỗ trợ." />
        <StatCard label="Kho ảnh" value={stats.imageAssets} hint="Ảnh trong kho sản phẩm." />
      </section>

      <div className="flex flex-wrap gap-3">
        <TabButton active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')}>
          Marketing monitor
        </TabButton>
        <TabButton
          active={activeTab === 'products'}
          onClick={() => {
            setActiveTab('products');
            setProductPanel('form');
            setTimeout(() => scrollToRef(productFormRef), 0);
          }}
        >
          Quản lý sản phẩm
        </TabButton>
        <TabButton
          active={activeTab === 'collections'}
          onClick={() => {
            setActiveTab('collections');
            setCollectionPanel('form');
            setTimeout(() => scrollToRef(collectionFormRef), 0);
          }}
        >
          Quản lý danh mục
        </TabButton>
        <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')}>
          Quản lý nội dung
        </TabButton>
        <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')}>
          Kho ảnh MinIO
        </TabButton>
        <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>
          Quản lý đơn hàng
        </TabButton>
      </div>

      <div className={`grid gap-8 ${activeTab === 'media' || activeTab === 'marketing' ? '' : 'xl:grid-cols-[1.05fr_0.95fr]'}`}>
        <div className="space-y-8">
          {activeTab === 'marketing' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Marketing Monitor</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">Sức khỏe landing page</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Theo dõi các khối giúp trang chủ chuyển từ catalog bán hàng sang landing page marketing: thông điệp, CTA, campaign, social proof và nội dung mạng xã hội.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('content');
                    setContentTab('home');
                  }}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Sửa homepage
                </button>
              </div>

              <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Excel cho Marketing Monitor</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Dùng workbook để xuất checklist marketing hiện tại, chỉnh sheet nhập và import lại phần homepage marketing cho locale đang làm việc.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadMarketingTemplate}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Tải template
                    </button>
                    <button
                      type="button"
                      onClick={handleExportMarketingToExcel}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Xuất Excel
                    </button>
                    <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                      {importingMarketing ? 'Đang import...' : 'Chọn file'}
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportMarketing}
                        disabled={importingMarketing}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {marketingImportSummary ? (
                  <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">
                      Đã import Marketing Monitor cho locale {marketingImportSummary.locale.toUpperCase()} với {marketingImportSummary.rows} dòng dữ liệu.
                    </p>
                    <p className="mt-1 text-slate-500">Đã cập nhật: {marketingImportSummary.updatedSections.join(', ')}.</p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-800">Checklist marketing</p>
                  <div className="mt-4 space-y-3">
                    {marketingAudit.checks.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                            item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {item.ok ? 'OK' : 'Cần bổ sung'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-[1.75rem] border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Hero message</p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">{homePageContent?.hero?.title || 'Chưa có hero title'}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{homePageContent?.hero?.description || 'Chưa có mô tả hero.'}</p>
                  </article>
                  <article className="rounded-[1.75rem] border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Campaign chính</p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">{homePageContent?.campaignBanner?.title || 'Chưa có campaign'}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{homePageContent?.campaignBanner?.to || 'Chưa gắn link campaign.'}</p>
                  </article>
                  <article className="rounded-[1.75rem] border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Social proof</p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">{homePageContent?.reviews?.length || 0} review</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">Dùng để giảm rủi ro nhận thức trước khi khách xem sản phẩm.</p>
                  </article>
                  <article className="rounded-[1.75rem] border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">UGC / Social</p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">{homePageContent?.ugcPosts?.length || 0} nội dung</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">Ảnh và caption từ Instagram/TikTok để làm landing page bớt giống trang bán hàng thuần túy.</p>
                  </article>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.75rem] border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-800">Các block homepage</p>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-[1fr_1.3fr_0.6fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <span>Block</span>
                      <span>Thông điệp</span>
                      <span className="text-right">Trạng thái</span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {homeSectionEntries.map((entry) => (
                        <div key={entry.key} className="grid grid-cols-[1fr_1.3fr_0.6fr] gap-3 px-4 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">{entry.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{entry.metric}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{entry.eyebrow || 'Chưa có eyebrow'}</p>
                            <p className="mt-1 text-slate-600">{entry.title || 'Chưa có title'}</p>
                          </div>
                          <div className="text-right">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {entry.enabled ? 'Đang bật' : 'Đang ẩn'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-800">CTA đang chạy</p>
                  <div className="mt-4 space-y-3">
                    {marketingCtas.map((cta) => (
                      <div key={`${cta.label}-${cta.to}`} className="rounded-2xl border border-slate-200 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{cta.label}</p>
                            <p className="mt-1 text-sm text-slate-600">{cta.text || 'Chưa có label'}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cta.to ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                            {cta.to ? 'Có link' : 'Thiếu link'}
                          </span>
                        </div>
                        <p className="mt-2 break-all text-xs text-slate-500">{cta.to || 'Chưa nhập URL'}</p>
                      </div>
                    ))}
                    {!marketingCtas.length ? (
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Chưa có CTA nào trong homepage.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'products' ? (
            <section ref={productListRef} className={`rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm ${productPanel === 'form' ? 'hidden xl:block' : 'block'}`}>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Products</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">Danh sách sản phẩm</h2>
                </div>
                <p className="text-sm text-slate-500">{products.length} sản phẩm</p>
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProductPanel('form');
                    resetProductForm();
                    setTimeout(() => scrollToRef(productFormRef), 0);
                  }}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  Mở form sản phẩm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductPanel('list');
                    setTimeout(() => scrollToRef(productListRef), 0);
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Xem danh sách
                </button>
              </div>

              <div className="space-y-4">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="grid gap-4 rounded-[1.5rem] border border-slate-200 p-4 lg:grid-cols-[112px_1fr_auto]"
                  >
                    <div className="aspect-square overflow-hidden rounded-[1.2rem] bg-slate-100">
                      {product.coverImage || product.images?.[0] ? (
                        <img
                          src={product.coverImage || product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">Chưa có ảnh</div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {getCollectionLabels(collections, getProductCollectionSlugs(product))}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                            product.status === 'draft'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {product.status === 'draft' ? 'Nháp' : 'Đang bán'}
                        </span>
                        {getProductBadges(product).map((badge) => (
                          <span
                            key={`${product.id}-${badge}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold text-slate-950">{product.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>{formatCurrency(product.price)}</span>
                        <span>Tồn kho: {product.stock}</span>
                        <span>SKU: {product.sku || 'Chưa có'}</span>
                        <span>{product.variants?.length || 0} biến thể</span>
                      </div>
                      {product.variants?.length ? (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                          <div className="grid grid-cols-[0.9fr_0.9fr_1.3fr_0.6fr] bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <span>Size</span>
                            <span>Màu</span>
                            <span>SKU</span>
                            <span className="text-right">Stock</span>
                          </div>
                          <div className="divide-y divide-slate-200">
                            {product.variants.slice(0, 6).map((variant) => (
                              <div
                                key={variant.id}
                                className="grid grid-cols-[0.9fr_0.9fr_1.3fr_0.6fr] px-4 py-3 text-sm text-slate-700"
                              >
                                <span>{variant.size}</span>
                                <span>{variant.color || '-'}</span>
                                <span className="truncate">{variant.sku || '-'}</span>
                                <span
                                  className={`text-right font-semibold ${
                                    variant.stock > 0 ? 'text-slate-950' : 'text-red-600'
                                  }`}
                                >
                                  {variant.stock}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === 'collections' ? (
            <section ref={collectionListRef} className={`rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm ${collectionPanel === 'form' ? 'hidden xl:block' : 'block'}`}>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Collections</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">Danh mục storefront</h2>
                </div>
                <p className="text-sm text-slate-500">{collections.length} danh mục</p>
              </div>

              <div className="space-y-4">
                {collections.map((collection) => (
                  <article key={collection.slug} className="rounded-[1.5rem] border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                            slug: {collection.slug}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              collection.isActive
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {collection.isActive ? 'Đang bật' : 'Đang ẩn'}
                          </span>
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold text-slate-950">{collection.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{collection.description}</p>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                          <span>{collectionProductCount[collection.slug] || 0} sản phẩm</span>
                          <span>Ưu tiên: {collection.sortPriority}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditCollection(collection)}
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCollection(collection.slug, collection.title)}
                          className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === 'content' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Content</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Bài viết và text storefront</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Chỉnh homepage, chiến dịch, lookbook, occasion landing và các trang thông tin ngay trên web.
                </p>
              </div>

              <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Ngôn ngữ nội dung đang sửa</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Chọn EN để nhập và lưu nội dung tiếng Anh vào CMS. Website public dùng cùng bộ VI/EN này.
                    </p>
                  </div>
                  <div className="flex rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold">
                    {[
                      { value: 'vi', label: 'VI' },
                      { value: 'en', label: 'EN' },
                    ].map((entry) => (
                      <button
                        key={entry.value}
                        type="button"
                        onClick={() => handleContentLocaleChange(entry.value)}
                        className={`rounded-full px-5 py-2 transition ${
                          contentLocale === entry.value ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        {entry.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Excel cho toàn bộ nội dung CMS</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Workbook này bao gồm trang chủ, landing bán hàng, editorial và các trang thông tin cho locale đang chọn.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Import sẽ cập nhật từng sheet theo key/slug đã map sẵn. Nếu file có sheet Meta với locale khác, admin sẽ đổi locale import theo file đó.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadContentTemplate}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Tải template
                    </button>
                    <button
                      type="button"
                      onClick={handleExportContentToExcel}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Xuất Excel
                    </button>
                    <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                      {importingContent ? 'Đang import...' : 'Chọn file'}
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportContent}
                        disabled={importingContent}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {contentImportSummary ? (
                  <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">
                      Locale {contentImportSummary.locale.toUpperCase()}: home {contentImportSummary.home}, merchandising {contentImportSummary.merchandising}, editorial {contentImportSummary.editorial}, info {contentImportSummary.info}, bỏ qua {contentImportSummary.skipped}.
                    </p>
                    {contentImportSummary.errors.length ? (
                      <ul className="mt-3 space-y-1 text-red-700">
                        {contentImportSummary.errors.slice(0, 6).map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <TabButton active={contentTab === 'home'} onClick={() => setContentTab('home')}>
                  Trang chủ
                </TabButton>
                <TabButton active={contentTab === 'merchandising'} onClick={() => setContentTab('merchandising')}>
                  Landing bán hàng
                </TabButton>
                <TabButton active={contentTab === 'editorial'} onClick={() => setContentTab('editorial')}>
                  Bài editorial
                </TabButton>
                <TabButton active={contentTab === 'info'} onClick={() => setContentTab('info')}>
                  Trang thông tin
                </TabButton>
              </div>

              <div className="mt-6 space-y-4">
                {contentTab === 'home' ? (
                  <div className="space-y-4">
                    <article className="rounded-[1.5rem] border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Hero hiện tại</p>
                      <h3 className="mt-3 text-2xl font-semibold text-slate-950">{homePageContent?.hero?.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{homePageContent?.hero?.description}</p>
                    </article>
                    <article className="rounded-[1.5rem] border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Announcement bar</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{siteChrome?.announcement}</p>
                    </article>
                  </div>
                ) : null}

                {contentTab === 'merchandising' ? (
                  <div className="grid gap-3">
                    {contentOptionEntries.merchandising.map((entry) => (
                      <SelectorButton
                        key={entry.key}
                        active={selectedMerchPage === entry.key}
                        onClick={() => setSelectedMerchPage(entry.key)}
                      >
                        {entry.label}
                      </SelectorButton>
                    ))}
                  </div>
                ) : null}

                {contentTab === 'editorial' ? (
                  <div className="grid gap-3">
                    {contentOptionEntries.editorial.map((entry) => {
                      const page = editorialPages?.[entry.sectionKey]?.[entry.slug];
                      return (
                        <SelectorButton
                          key={`${entry.sectionKey}:${entry.slug}`}
                          active={selectedEditorialKey === `${entry.sectionKey}:${entry.slug}`}
                          onClick={() => setSelectedEditorialKey(`${entry.sectionKey}:${entry.slug}`)}
                        >
                          <div>{entry.label}</div>
                          <div className={`mt-1 text-xs ${selectedEditorialKey === `${entry.sectionKey}:${entry.slug}` ? 'text-slate-200' : 'text-slate-500'}`}>
                            {page?.title}
                          </div>
                        </SelectorButton>
                      );
                    })}
                  </div>
                ) : null}

                {contentTab === 'info' ? (
                  <div className="grid gap-3">
                    {contentOptionEntries.info.map((entry) => {
                      const page = infoPages?.[entry.key];
                      return (
                        <SelectorButton
                          key={entry.key}
                          active={selectedInfoPage === entry.key}
                          onClick={() => setSelectedInfoPage(entry.key)}
                        >
                          <div>{entry.label}</div>
                          <div className={`mt-1 text-xs ${selectedInfoPage === entry.key ? 'text-slate-200' : 'text-slate-500'}`}>
                            {page?.title}
                          </div>
                        </SelectorButton>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeTab === 'media' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">MinIO Media</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">Kho ảnh sản phẩm</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Upload ảnh vào MinIO, dùng lại ảnh cho sản phẩm và xóa những object không còn cần thiết.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadProductImageLibrary}
                  disabled={imageLibraryLoading}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:text-slate-400"
                >
                  {imageLibraryLoading ? 'Đang tải...' : 'Tải lại kho ảnh'}
                </button>
              </div>

              <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <label htmlFor="admin-media-library-upload" className="text-sm font-semibold text-slate-800">
                  Upload ảnh vào kho MinIO
                </label>
                <input
                  id="admin-media-library-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadMediaImages}
                  className="mt-3 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                />
                {mediaUploading ? (
                  <p className="mt-3 text-sm text-slate-500">Đang upload ảnh vào MinIO...</p>
                ) : null}
              </div>

              {imageLibraryError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {imageLibraryError}
                </p>
              ) : null}

              {!imageLibraryError && imageLibraryLoading ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                  Đang tải danh sách object từ MinIO...
                </div>
              ) : null}

              {!imageLibraryError && !imageLibraryLoading && !imageLibrary.length ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                  Kho ảnh sản phẩm đang trống.
                </div>
              ) : null}

              {!imageLibraryError && imageLibrary.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {imageLibrary.map((image) => (
                    <article key={image.object_name} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                      <img src={image.url} alt="Ảnh sản phẩm trong MinIO" className="aspect-square w-full object-cover" />
                      <div className="space-y-4 p-4">
                        <div>
                          <p className="truncate text-sm font-semibold text-slate-900" title={image.object_name}>
                            {image.object_name.replace('products/', '')}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatFileSize(image.size)} · {image.content_type}
                          </p>
                          <p className={`mt-2 text-xs font-semibold ${image.product_usage_count ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {image.product_usage_count
                              ? `${image.product_usage_count} sản phẩm đang dùng`
                              : 'Chưa gắn sản phẩm nào'}
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleUseImageInProductForm(image.url, 'cover')}
                            className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Đặt cover
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUseImageInProductForm(image.url, 'gallery')}
                            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            Thêm gallery
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              clearFeedback();
                              navigator.clipboard?.writeText(image.url);
                              setSuccessMessage('Đã copy URL ảnh.');
                            }}
                            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            Copy URL
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProductImage(image)}
                            disabled={deletingImageName === image.object_name || image.product_usage_count > 0}
                            className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:border-slate-200 disabled:text-slate-300"
                          >
                            {deletingImageName === image.object_name
                              ? 'Đang xóa...'
                              : image.product_usage_count > 0
                              ? 'Đang dùng'
                              : 'Xóa'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === 'orders' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Orders</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">Danh sách đơn hàng</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Chọn một đơn để xem chi tiết và đổi trạng thái xử lý.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReloadOrders}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {ordersLoading ? 'Đang tải...' : 'Tải lại'}
                </button>
              </div>

              <div className="space-y-4">
                {ordersLoading ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                    Đang tải đơn hàng...
                  </div>
                ) : null}

                {!ordersLoading && !orders.length ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                    Chưa có đơn hàng nào để quản lý.
                  </div>
                ) : null}

                {orders.map((order) => (
                  <SelectorButton
                    key={order.id}
                    active={selectedOrder?.id === order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div>{order.orderNumber}</div>
                        <div className={`mt-1 text-xs ${selectedOrder?.id === order.id ? 'text-slate-200' : 'text-slate-500'}`}>
                          {order.email} {order.contact_phone ? `· ${order.contact_phone}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div>{formatCurrency(order.total_amount)}</div>
                        <div className={`mt-1 text-xs ${selectedOrder?.id === order.id ? 'text-slate-200' : 'text-slate-500'}`}>
                          {formatOrderStatusLabel(order.status)}
                        </div>
                      </div>
                    </div>
                  </SelectorButton>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-8">
          {activeTab === 'products' ? (
            <form
              ref={productFormRef}
              onSubmit={handleSubmitProduct}
              className={`rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm ${productPanel === 'list' ? 'hidden xl:block' : 'block'}`}
            >
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Product Form</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                    {editingProductId ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm mới'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Tại đây bạn có thể thêm mới sản phẩm, thay ảnh cover, upload gallery và chỉnh toàn bộ thông tin sản phẩm.
                  </p>
                </div>
                {editingProductId ? (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Tạo mới
                  </button>
                ) : null}
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProductPanel('form');
                    setTimeout(() => scrollToRef(productFormRef), 0);
                  }}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  Form sản phẩm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductPanel('list');
                    setTimeout(() => scrollToRef(productListRef), 0);
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Danh sách sản phẩm
                </button>
              </div>

              <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Import sản phẩm từ Excel</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Hỗ trợ .xlsx, .xls, .csv. Có thể bỏ trống cột ảnh; sau khi import, vào từng sản phẩm để bổ sung cover và gallery.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Mỗi dòng là một sản phẩm. Nếu nhiều dòng dùng cùng slug, hệ thống sẽ gộp thành một sản phẩm và cộng thêm biến thể. Danh mục có thể nhập slug hoặc tên danh mục, nhiều danh mục ngăn cách bằng dấu phẩy.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadProductImportTemplate}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Tải template
                    </button>
                    <button
                      type="button"
                      onClick={handleExportProductsToExcel}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Xuất Excel
                    </button>
                    <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                      {importingProducts ? 'Đang import...' : 'Chọn file'}
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportProducts}
                        disabled={importingProducts}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {productImportSummary ? (
                  <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">
                      Tổng {productImportSummary.total} dòng, {productImportSummary.products || productImportSummary.total} sản phẩm, tạo {productImportSummary.created}, cập nhật {productImportSummary.updated}, bỏ qua {productImportSummary.skipped}.
                    </p>
                    {productImportSummary.errors.length ? (
                      <ul className="mt-3 space-y-1 text-red-700">
                        {productImportSummary.errors.slice(0, 6).map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Tên sản phẩm" name="name" value={productForm.name} onChange={handleFormFieldChange(setProductForm)} required />
                  <TextInput label="Slug" name="slug" value={productForm.slug} onChange={handleFormFieldChange(setProductForm)} required />
                  <TextInput label="SKU" name="sku" value={productForm.sku} onChange={handleFormFieldChange(setProductForm)} />
                  <Field label="Trạng thái">
                    <select
                      name="status"
                      value={productForm.status}
                      onChange={handleFormFieldChange(setProductForm)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                    >
                      <option value="active">Đang bán</option>
                      <option value="draft">Nháp</option>
                    </select>
                  </Field>
                  <Field label="Danh mục" hint="Giữ Ctrl/Cmd để chọn nhiều">
                    <select
                      name="collectionSlugs"
                      value={productForm.collectionSlugs}
                      onChange={handleFormFieldChange(setProductForm)}
                      multiple
                      className="min-h-[150px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      required
                    >
                      {collections.map((collection) => (
                        <option key={collection.slug} value={collection.slug}>
                          {collection.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <TextArea
                  label="Mô tả"
                  rows={5}
                  name="description"
                  value={productForm.description}
                  onChange={handleFormFieldChange(setProductForm)}
                  required
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <TextInput label="Giá bán (VNĐ)" type="number" min="0" step="1000" name="price" value={productForm.price} onChange={handleFormFieldChange(setProductForm)} required />
                  <TextInput label="Giá gạch (VNĐ)" type="number" min="0" step="1000" name="compareAtPrice" value={productForm.compareAtPrice} onChange={handleFormFieldChange(setProductForm)} />
                  <TextInput label="Trending score" type="number" min="0" max="100" name="trendingScore" value={productForm.trendingScore} onChange={handleFormFieldChange(setProductForm)} />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
                  Sản phẩm có thể nằm trong nhiều danh mục. Danh mục đầu tiên trong danh sách đã chọn sẽ được dùng làm danh mục chính cho dữ liệu cũ, còn storefront sẽ hiển thị sản phẩm ở tất cả danh mục đã chọn.
                </div>

                <TextArea
                  label="Variants"
                  hint="Mỗi dòng: size | màu | sku | stock. Đây là nguồn chính cho tồn kho và option trên web."
                  rows={5}
                  name="variants"
                  value={productForm.variants}
                  onChange={handleFormFieldChange(setProductForm)}
                />

                {variantPreview.length ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-[0.9fr_0.9fr_1.3fr_0.6fr] bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span>Size</span>
                      <span>Màu</span>
                      <span>SKU</span>
                      <span className="text-right">Stock</span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {variantPreview.map((variant) => (
                        <div
                          key={variant.id}
                          className="grid grid-cols-[0.9fr_0.9fr_1.3fr_0.6fr] px-4 py-3 text-sm text-slate-700"
                        >
                          <span>{variant.size}</span>
                          <span>{variant.color}</span>
                          <span className="truncate">{variant.sku}</span>
                          <span className={`text-right font-semibold ${variant.stock > 0 ? 'text-slate-950' : 'text-red-600'}`}>
                            {variant.stock}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Chất liệu" name="material" value={productForm.material} onChange={handleFormFieldChange(setProductForm)} />
                  <TextInput label="Ghi chú fit" name="fitNotes" value={productForm.fitNotes} onChange={handleFormFieldChange(setProductForm)} />
                </div>

                <TextInput
                  label="Style tags"
                  hint="phân tách bằng dấu phẩy"
                  name="styleTags"
                  value={productForm.styleTags}
                  onChange={handleFormFieldChange(setProductForm)}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="SEO title" name="seoTitle" value={productForm.seoTitle} onChange={handleFormFieldChange(setProductForm)} />
                  <TextInput label="SEO description" name="seoDescription" value={productForm.seoDescription} onChange={handleFormFieldChange(setProductForm)} />
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Bản dịch tiếng Anh</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Khi người dùng chọn EN, các field này sẽ thay thế nội dung tiếng Việt nếu có dữ liệu. Để trống field nào thì storefront tự dùng bản gốc.
                  </p>
                  <div className="mt-4 space-y-4">
                    <TextInput label="English name" name="enName" value={productForm.enName} onChange={handleFormFieldChange(setProductForm)} />
                    <TextArea label="English description" rows={4} name="enDescription" value={productForm.enDescription} onChange={handleFormFieldChange(setProductForm)} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="English material" name="enMaterial" value={productForm.enMaterial} onChange={handleFormFieldChange(setProductForm)} />
                      <TextInput label="English fit notes" name="enFitNotes" value={productForm.enFitNotes} onChange={handleFormFieldChange(setProductForm)} />
                      <TextInput label="English SEO title" name="enSeoTitle" value={productForm.enSeoTitle} onChange={handleFormFieldChange(setProductForm)} />
                      <TextInput label="English SEO description" name="enSeoDescription" value={productForm.enSeoDescription} onChange={handleFormFieldChange(setProductForm)} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Checkbox name="isNew" checked={productForm.isNew} onChange={handleFormFieldChange(setProductForm)} label="Badge Mới" />
                  <Checkbox name="isBestSeller" checked={productForm.isBestSeller} onChange={handleFormFieldChange(setProductForm)} label="Badge Bán chạy" />
                  <Checkbox name="isOnSale" checked={productForm.isOnSale} onChange={handleFormFieldChange(setProductForm)} label="Badge Giảm giá" />
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 p-5">
                  <div className="grid gap-4">
                    <TextInput label="Ảnh cover URL" name="coverImage" value={productForm.coverImage} onChange={handleFormFieldChange(setProductForm)} />
                    <div className="rounded-[1.5rem] border border-[#d8aea8] bg-[linear-gradient(135deg,#f2d7d2_0%,#f4e8c7_55%,#dfe9e4_100%)] px-5 py-4 shadow-[0_18px_45px_rgba(166,99,91,0.12)]">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8f514a]">
                        Gợi ý chọn ảnh
                      </p>
                      <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
                        <p>
                          <span className="font-semibold text-slate-950">Ảnh cover:</span> tập trung vào người mẫu,
                          toát ra sự tự nhiên, thoải mái và rạng rỡ.
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">Ảnh gallery:</span> thể hiện chi tiết các
                          góc chụp để làm rõ giá trị sản phẩm.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="admin-cover-upload" className="text-sm font-semibold text-slate-800">
                        Upload ảnh cover
                      </label>
                      <input
                        id="admin-cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleUploadProductImages(event, 'cover')}
                        className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    <TextArea
                      label="Gallery URLs"
                      hint="Mỗi dòng một URL. Muốn bỏ ảnh cũ, xóa dòng URL hoặc bấm Bỏ ảnh ở preview bên dưới."
                      rows={4}
                      name="images"
                      value={productForm.images}
                      onChange={handleFormFieldChange(setProductForm)}
                    />
                    <div className="space-y-2">
                      <label htmlFor="admin-gallery-upload" className="text-sm font-semibold text-slate-800">
                        Upload gallery
                      </label>
                      <input
                        id="admin-gallery-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => handleUploadProductImages(event, 'gallery')}
                        className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    {uploadingTarget ? (
                      <p className="text-sm text-slate-500">
                        Đang upload {uploadingTarget === 'cover' ? 'ảnh cover' : 'gallery'}...
                      </p>
                    ) : null}
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">Thư viện ảnh MinIO</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Chọn ảnh đã upload để dùng lại cho cover hoặc gallery.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={loadProductImageLibrary}
                          disabled={imageLibraryLoading}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:text-slate-400"
                        >
                          {imageLibraryLoading ? 'Đang tải...' : 'Tải lại'}
                        </button>
                      </div>

                      {imageLibraryError ? (
                        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {imageLibraryError}
                        </p>
                      ) : null}

                      {!imageLibraryError && imageLibraryLoading ? (
                        <p className="text-sm text-slate-500">Đang tải thư viện ảnh...</p>
                      ) : null}

                      {!imageLibraryError && !imageLibraryLoading && !imageLibrary.length ? (
                        <p className="text-sm text-slate-500">Chưa có ảnh nào trong thư mục products của MinIO.</p>
                      ) : null}

                      {!imageLibraryError && imageLibrary.length ? (
                        <div className="grid max-h-[28rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                          {imageLibrary.map((image) => (
                            <div key={image.object_name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                              <img src={image.url} alt="Ảnh trong thư viện MinIO" className="aspect-square w-full object-cover" />
                              <div className="space-y-3 p-3">
                                <div>
                                  <p className="truncate text-sm font-semibold text-slate-800" title={image.object_name}>
                                    {image.object_name.replace('products/', '')}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">{formatFileSize(image.size)}</p>
                                  <p className={`mt-1 text-xs font-semibold ${image.product_usage_count ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {image.product_usage_count
                                      ? `${image.product_usage_count} sản phẩm đang dùng`
                                      : 'Chưa gắn sản phẩm nào'}
                                  </p>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectProductImage(image.url, 'cover')}
                                    className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                                  >
                                    Đặt cover
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectProductImage(image.url, 'gallery')}
                                    className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                                  >
                                    Thêm gallery
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {imagePreviews.length ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {imagePreviews.map((image) => {
                          const isCover = productForm.coverImage === image;
                          return (
                          <div key={image} className="overflow-hidden rounded-2xl bg-slate-100">
                            <div className="relative">
                              <img src={image} alt="Xem truoc anh san pham" className="aspect-square h-full w-full object-cover" />
                              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                                {isCover ? 'Cover' : 'Gallery'}
                              </span>
                            </div>
                            <div className="bg-white p-3">
                              <button
                                type="button"
                                onClick={() => handleRemoveProductFormImage(image)}
                                className="w-full rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                              >
                                {isCover ? 'Bỏ cover' : 'Bỏ ảnh'}
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {editingProductId ? 'Lưu thay đổi' : 'Đăng sản phẩm'}
                  </button>
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700"
                  >
                    Làm mới form
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {activeTab === 'collections' ? (
            <form
              ref={collectionFormRef}
              onSubmit={handleSubmitCollection}
              className={`rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm ${collectionPanel === 'list' ? 'hidden xl:block' : 'block'}`}
            >
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Collection Form</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                    {editingCollectionSlug ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}
                  </h2>
                </div>
                {editingCollectionSlug ? (
                  <button
                    type="button"
                    onClick={resetCollectionForm}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Tạo mới
                  </button>
                ) : null}
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCollectionPanel('form');
                    setTimeout(() => scrollToRef(collectionFormRef), 0);
                  }}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                >
                  Form danh mục
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCollectionPanel('list');
                    setTimeout(() => scrollToRef(collectionListRef), 0);
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Danh sách danh mục
                </button>
              </div>

              <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Import danh mục từ Excel</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Hỗ trợ .xlsx, .xls, .csv. Có thể tạo mới hoặc cập nhật danh mục hiện có, bao gồm cả bản dịch EN và SEO text.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Nếu cần đổi slug của một danh mục cũ, giữ slug hiện tại ở cột "Slug cũ" và nhập slug mới ở cột "Slug".
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadCollectionImportTemplate}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Tải template
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCollectionsToExcel}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Xuất Excel
                    </button>
                    <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                      {importingCollections ? 'Đang import...' : 'Chọn file'}
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportCollections}
                        disabled={importingCollections}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {collectionImportSummary ? (
                  <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">
                      Tổng {collectionImportSummary.total} dòng, {collectionImportSummary.collections} danh mục, tạo {collectionImportSummary.created}, cập nhật {collectionImportSummary.updated}, bỏ qua {collectionImportSummary.skipped}.
                    </p>
                    {collectionImportSummary.errors.length ? (
                      <ul className="mt-3 space-y-1 text-red-700">
                        {collectionImportSummary.errors.slice(0, 6).map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Tên danh mục" name="title" value={collectionForm.title} onChange={handleFormFieldChange(setCollectionForm)} required />
                  <TextInput label="Slug" name="slug" value={collectionForm.slug} onChange={handleFormFieldChange(setCollectionForm)} required />
                  <TextInput label="Sort priority" type="number" min="0" name="sortPriority" value={collectionForm.sortPriority} onChange={handleFormFieldChange(setCollectionForm)} />
                </div>

                <TextArea label="Mô tả" rows={4} name="description" value={collectionForm.description} onChange={handleFormFieldChange(setCollectionForm)} required />
                <TextInput
                  label="Ảnh nền danh mục"
                  hint="URL ảnh dùng cho card danh mục trên homepage và các khối điều hướng theo danh mục."
                  name="image"
                  value={collectionForm.image}
                  onChange={handleFormFieldChange(setCollectionForm)}
                />
                <TextInput
                  label="Featured keywords"
                  hint="phân tách bằng dấu phẩy"
                  name="featuredKeywords"
                  value={collectionForm.featuredKeywords}
                  onChange={handleFormFieldChange(setCollectionForm)}
                />
                {collectionForm.image ? (
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                    <div
                      className="aspect-[16/7] w-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${collectionForm.image}")` }}
                    />
                  </div>
                ) : null}
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
                  Danh mục giờ chỉ giữ những field có ích thật sự cho storefront và SEO. Các text kiểu eyebrow hoặc highlight ngắn đã được bỏ để model nhẹ hơn và đỡ rườm rà khi vận hành.
                </div>
                <TextInput label="SEO heading" name="seoHeading" value={collectionForm.seoHeading} onChange={handleFormFieldChange(setCollectionForm)} />
                <TextArea label="SEO body" rows={5} name="seoBody" value={collectionForm.seoBody} onChange={handleFormFieldChange(setCollectionForm)} />

                <div className="rounded-[1.75rem] border border-slate-200 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Bản dịch tiếng Anh</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Dùng cho tên, mô tả và SEO collection khi khách chuyển website sang EN.
                  </p>
                  <div className="mt-4 space-y-4">
                    <TextInput label="English collection title" name="enTitle" value={collectionForm.enTitle} onChange={handleFormFieldChange(setCollectionForm)} />
                    <TextArea label="English description" rows={4} name="enDescription" value={collectionForm.enDescription} onChange={handleFormFieldChange(setCollectionForm)} />
                    <TextInput label="English SEO heading" name="enSeoHeading" value={collectionForm.enSeoHeading} onChange={handleFormFieldChange(setCollectionForm)} />
                    <TextArea label="English SEO body" rows={5} name="enSeoBody" value={collectionForm.enSeoBody} onChange={handleFormFieldChange(setCollectionForm)} />
                  </div>
                </div>
                <Checkbox name="isActive" checked={collectionForm.isActive} onChange={handleFormFieldChange(setCollectionForm)} label="Hiển thị danh mục ngoài storefront" />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {editingCollectionSlug ? 'Lưu thay đổi' : 'Tạo danh mục'}
                  </button>
                  <button
                    type="button"
                    onClick={resetCollectionForm}
                    className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700"
                  >
                    Làm mới form
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {activeTab === 'content' && contentTab === 'home' ? (
            <form
              onSubmit={handleSubmitHomeContent}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm"
            >
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Home & Site Text</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Trang chủ và khung text chung</h2>
              </div>

              <div className="space-y-6">
                <TextInput label="Tên thương hiệu" name="brandName" value={homeForm.brandName} onChange={handleFormFieldChange(setHomeForm)} />
                <TextInput label="Announcement bar" name="announcement" value={homeForm.announcement} onChange={handleFormFieldChange(setHomeForm)} />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Footer heading" name="footerHeading" value={homeForm.footerHeading} onChange={handleFormFieldChange(setHomeForm)} />
                  <TextInput label="Footer description" name="footerDescription" value={homeForm.footerDescription} onChange={handleFormFieldChange(setHomeForm)} />
                </div>
                <TextInput
                  label="Thời lượng giữ hàng tại cửa hàng"
                  hint="Ví dụ: 24h, 48h"
                  name="storeHoldDurationLabel"
                  value={homeForm.storeHoldDurationLabel}
                  onChange={handleFormFieldChange(setHomeForm)}
                />
                <TextInput
                  label="Ảnh nền website"
                  hint="Dán URL ảnh thiên nhiên, ảnh từ MinIO hoặc để trống để dùng nền mặc định."
                  name="backgroundImage"
                  value={homeForm.backgroundImage}
                  onChange={handleFormFieldChange(setHomeForm)}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleOpenBackgroundImageLibrary}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    {showBackgroundImageLibrary ? 'Đóng kho ảnh' : 'Chọn từ kho ảnh'}
                  </button>
                  <button
                    type="button"
                    onClick={loadProductImageLibrary}
                    disabled={imageLibraryLoading}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:text-slate-400"
                  >
                    {imageLibraryLoading ? 'Đang tải...' : 'Tải lại kho ảnh'}
                  </button>
                </div>
                {showBackgroundImageLibrary ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-950">Chọn ảnh nền từ MinIO</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Nên chọn ảnh ngang, sáng, ít chi tiết rối. Ảnh đang dùng cho sản phẩm vẫn có thể được chọn làm nền.
                      </p>
                    </div>

                    {imageLibraryError ? (
                      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {imageLibraryError}
                      </p>
                    ) : null}

                    {!imageLibraryError && imageLibraryLoading ? (
                      <p className="text-sm text-slate-500">Đang tải thư viện ảnh...</p>
                    ) : null}

                    {!imageLibraryError && !imageLibraryLoading && !imageLibrary.length ? (
                      <p className="text-sm text-slate-500">
                        Kho ảnh đang trống. Hãy upload ảnh trong tab Kho ảnh MinIO trước.
                      </p>
                    ) : null}

                    {!imageLibraryError && imageLibrary.length ? (
                      <div className="grid max-h-[30rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                        {imageLibrary.map((image) => (
                          <article key={`background-${image.object_name}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <img src={image.url} alt="Ảnh nền từ kho MinIO" className="aspect-video w-full object-cover" />
                            <div className="space-y-3 p-3">
                              <div>
                                <p className="truncate text-sm font-semibold text-slate-800" title={image.object_name}>
                                  {image.object_name.replace('products/', '')}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatFileSize(image.size)} · {image.content_type}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectBackgroundImage(image.url)}
                                className="w-full rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                              >
                                Chọn làm ảnh nền
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {homeForm.backgroundImage ? (
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/80">
                    <div
                      className="h-44 bg-cover bg-center"
                      style={{ backgroundImage: `url("${homeForm.backgroundImage}")` }}
                    />
                    <p className="px-4 py-3 text-sm text-slate-600">
                      Xem trước ảnh nền. Khi lưu, ảnh này sẽ áp dụng cho toàn bộ website public và admin.
                    </p>
                  </div>
                ) : null}

                <div className="rounded-[1.75rem] border border-slate-200 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Hero</h3>
                  <div className="mt-4 space-y-4">
                    <TextInput
                      label="Hero image"
                      hint="URL ảnh riêng cho hero trang chủ. Để trống thì hero sẽ dùng ảnh nền website."
                      name="heroImage"
                      value={homeForm.heroImage}
                      onChange={handleFormFieldChange(setHomeForm)}
                    />
                    {homeForm.heroImage ? (
                      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                        <div
                          className="aspect-[16/7] w-full bg-cover bg-center"
                          style={{ backgroundImage: `url("${homeForm.heroImage}")` }}
                        />
                      </div>
                    ) : null}
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Eyebrow" name="heroEyebrow" value={homeForm.heroEyebrow} onChange={handleFormFieldChange(setHomeForm)} />
                      <TextInput label="Hero title" name="heroTitle" value={homeForm.heroTitle} onChange={handleFormFieldChange(setHomeForm)} />
                    </div>
                    <TextArea label="Hero description" rows={4} name="heroDescription" value={homeForm.heroDescription} onChange={handleFormFieldChange(setHomeForm)} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="CTA chính label" name="heroPrimaryCtaLabel" value={homeForm.heroPrimaryCtaLabel} onChange={handleFormFieldChange(setHomeForm)} />
                      <TextInput label="CTA chính link" name="heroPrimaryCtaTo" value={homeForm.heroPrimaryCtaTo} onChange={handleFormFieldChange(setHomeForm)} />
                      <TextInput label="CTA phụ label" name="heroSecondaryCtaLabel" value={homeForm.heroSecondaryCtaLabel} onChange={handleFormFieldChange(setHomeForm)} />
                      <TextInput label="CTA phụ link" name="heroSecondaryCtaTo" value={homeForm.heroSecondaryCtaTo} onChange={handleFormFieldChange(setHomeForm)} />
                    </div>
                    <TextArea
                      label="Hero stats"
                      hint="Mỗi dòng: nhãn | giá trị | mô tả"
                      rows={5}
                      name="heroStats"
                      value={homeForm.heroStats}
                      onChange={handleFormFieldChange(setHomeForm)}
                    />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Điều khiển block homepage</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Dùng để đổi heading/CTA và bật tắt các khối landing page. Nếu muốn thiên về marketing, có thể tắt bớt block sản phẩm như <code>newIn</code>, <code>bestsellers</code> hoặc <code>categories</code>.
                  </p>
                  <div className="mt-4">
                    <TextArea
                      label="Homepage blocks"
                      hint="Mỗi dòng: key | eyebrow | title | CTA label | CTA link | on/off"
                      rows={9}
                      name="sectionControls"
                      value={homeForm.sectionControls}
                      onChange={handleFormFieldChange(setHomeForm)}
                    />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Campaign banner lớn</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Nội dung này hiển thị ở block lớn “Chiến dịch nổi bật” gần cuối trang chủ. Các card phụ ở đầu trang lấy từ danh mục active trong Admin.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <TextInput label="Eyebrow" name="campaignEyebrow" value={homeForm.campaignEyebrow} onChange={handleFormFieldChange(setHomeForm)} />
                    <TextInput label="Title" name="campaignTitle" value={homeForm.campaignTitle} onChange={handleFormFieldChange(setHomeForm)} />
                    <TextInput label="Link" name="campaignTo" value={homeForm.campaignTo} onChange={handleFormFieldChange(setHomeForm)} />
                    <TextInput label="CTA label" name="campaignCtaLabel" value={homeForm.campaignCtaLabel} onChange={handleFormFieldChange(setHomeForm)} />
                  </div>
                  <div className="mt-4">
                    <TextArea label="Description" rows={4} name="campaignDescription" value={homeForm.campaignDescription} onChange={handleFormFieldChange(setHomeForm)} />
                  </div>
                </div>

                <TextArea label="USP bar" hint="Mỗi dòng: tiêu đề | mô tả" rows={6} name="uspItems" value={homeForm.uspItems} onChange={handleFormFieldChange(setHomeForm)} />
                <TextArea label="Reviews" hint="Mỗi dòng: quote | tên | meta | rating" rows={5} name="reviews" value={homeForm.reviews} onChange={handleFormFieldChange(setHomeForm)} />
                <div className="grid gap-4 md:grid-cols-3">
                  <TextInput label="Newsletter eyebrow" name="newsletterEyebrow" value={homeForm.newsletterEyebrow} onChange={handleFormFieldChange(setHomeForm)} />
                  <TextInput label="Newsletter title" name="newsletterTitle" value={homeForm.newsletterTitle} onChange={handleFormFieldChange(setHomeForm)} />
                  <TextInput label="Newsletter description" name="newsletterDescription" value={homeForm.newsletterDescription} onChange={handleFormFieldChange(setHomeForm)} />
                </div>
                <TextArea label="UGC block" hint="Mỗi dòng: nền tảng | handle | caption | ảnh" rows={6} name="ugcPosts" value={homeForm.ugcPosts} onChange={handleFormFieldChange(setHomeForm)} />

                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Lưu text trang chủ
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === 'content' && contentTab === 'merchandising' ? (
            <form
              onSubmit={handleSubmitMerchContent}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm"
            >
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Merchandising</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Landing page bán hàng</h2>
              </div>

              <div className="space-y-4">
                <TextInput label="Eyebrow" name="eyebrow" value={merchForm.eyebrow} onChange={handleFormFieldChange(setMerchForm)} />
                <TextInput label="Title" name="title" value={merchForm.title} onChange={handleFormFieldChange(setMerchForm)} />
                <TextArea label="Description" rows={5} name="description" value={merchForm.description} onChange={handleFormFieldChange(setMerchForm)} />
                <TextInput
                  label="Ảnh hero"
                  hint="URL ảnh nền cho trang landing này."
                  name="image"
                  value={merchForm.image}
                  onChange={handleFormFieldChange(setMerchForm)}
                />
                {merchForm.image ? (
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                    <div className="aspect-[16/7] w-full bg-cover bg-center" style={{ backgroundImage: `url("${merchForm.image}")` }} />
                  </div>
                ) : null}
                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Lưu landing page
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === 'content' && contentTab === 'editorial' ? (
            <form
              onSubmit={handleSubmitEditorialContent}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm"
            >
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Editorial</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Bài editorial và campaign</h2>
              </div>

              <div className="space-y-4">
                <TextInput label="Eyebrow" name="eyebrow" value={editorialForm.eyebrow} onChange={handleFormFieldChange(setEditorialForm)} />
                <TextInput label="Title" name="title" value={editorialForm.title} onChange={handleFormFieldChange(setEditorialForm)} />
                <TextArea label="Description" rows={5} name="description" value={editorialForm.description} onChange={handleFormFieldChange(setEditorialForm)} />
                <TextInput label="Ảnh hero/card" name="image" value={editorialForm.image} onChange={handleFormFieldChange(setEditorialForm)} />
                <TextArea label="Bullets" hint="Mỗi dòng một bullet" rows={4} name="bullets" value={editorialForm.bullets} onChange={handleFormFieldChange(setEditorialForm)} />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="CTA label" name="ctaLabel" value={editorialForm.ctaLabel} onChange={handleFormFieldChange(setEditorialForm)} />
                  <TextInput label="CTA link" name="ctaTo" value={editorialForm.ctaTo} onChange={handleFormFieldChange(setEditorialForm)} />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Lưu bài editorial
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === 'content' && contentTab === 'info' ? (
            <form
              onSubmit={handleSubmitInfoContent}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm"
            >
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Info Pages</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Trang thông tin và hỗ trợ</h2>
              </div>

              <div className="space-y-4">
                <TextInput label="Eyebrow" name="eyebrow" value={infoForm.eyebrow} onChange={handleFormFieldChange(setInfoForm)} />
                <TextInput label="Title" name="title" value={infoForm.title} onChange={handleFormFieldChange(setInfoForm)} />
                <TextArea label="Intro" rows={4} name="intro" value={infoForm.intro} onChange={handleFormFieldChange(setInfoForm)} />
                <TextInput
                  label="Ảnh hero"
                  hint="URL ảnh nền cho phần đầu trang thông tin."
                  name="image"
                  value={infoForm.image}
                  onChange={handleFormFieldChange(setInfoForm)}
                />
                {infoForm.image ? (
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                    <div className="aspect-[16/7] w-full bg-cover bg-center" style={{ backgroundImage: `url("${infoForm.image}")` }} />
                  </div>
                ) : null}
                <TextArea label="Sections" hint="Mỗi dòng: tiêu đề | nội dung" rows={6} name="sections" value={infoForm.sections} onChange={handleFormFieldChange(setInfoForm)} />
                <TextInput label="Table headers" hint="ngăn cách bằng dấu phẩy" name="tableHeaders" value={infoForm.tableHeaders} onChange={handleFormFieldChange(setInfoForm)} />
                <TextArea label="Table rows" hint="Mỗi dòng: cột 1 | cột 2 | cột 3..." rows={5} name="tableRows" value={infoForm.tableRows} onChange={handleFormFieldChange(setInfoForm)} />
                <TextArea label="FAQs" hint="Mỗi dòng: câu hỏi | trả lời" rows={5} name="faqs" value={infoForm.faqs} onChange={handleFormFieldChange(setInfoForm)} />
                <TextArea label="Cards" hint="Mỗi dòng: title | detail | note" rows={5} name="cards" value={infoForm.cards} onChange={handleFormFieldChange(setInfoForm)} />
                <TextArea label="Steps" hint="Mỗi dòng một bước" rows={4} name="steps" value={infoForm.steps} onChange={handleFormFieldChange(setInfoForm)} />

                {selectedInfoPage === 'contact' ? (
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-950">Google Map cửa hàng</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Có thể nhập địa chỉ, tọa độ lấy từ Google Maps, hoặc dán embed URL từ Google Maps. Nếu chưa có embed URL, website sẽ tự dựng map theo tọa độ hoặc địa chỉ.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Tên điểm trên map" name="mapTitle" value={infoForm.mapTitle} onChange={handleFormFieldChange(setInfoForm)} />
                      <TextInput label="Địa chỉ cửa hàng" name="mapAddress" value={infoForm.mapAddress} onChange={handleFormFieldChange(setInfoForm)} />
                      <TextInput
                        label="Tọa độ Google"
                        hint="Ví dụ: 21.028511,105.804817"
                        name="mapCoordinates"
                        value={infoForm.mapCoordinates}
                        onChange={handleFormFieldChange(setInfoForm)}
                      />
                      <TextInput
                        label="Link mở Google Maps"
                        hint="Dán link share từ Google Maps"
                        name="mapUrl"
                        value={infoForm.mapUrl}
                        onChange={handleFormFieldChange(setInfoForm)}
                      />
                    </div>
                    <div className="mt-4">
                      <TextInput
                        label="Google Maps embed URL"
                        hint="Google Maps > Chia sẻ > Nhúng bản đồ > copy phần src"
                        name="mapEmbedUrl"
                        value={infoForm.mapEmbedUrl}
                        onChange={handleFormFieldChange(setInfoForm)}
                      />
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Lưu trang thông tin
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === 'orders' ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Order Detail</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Chi tiết và trạng thái đơn</h2>
              </div>

              {!selectedOrder ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                  Chọn một đơn hàng ở cột bên trái để xem chi tiết.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Mã đơn</p>
                        <h3 className="mt-3 text-2xl font-semibold text-slate-950">{selectedOrder.orderNumber}</h3>
                        <p className="mt-2 text-sm text-slate-600">
                          {new Date(selectedOrder.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        {formatOrderStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Khách hàng</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{selectedOrder.email}</p>
                      {selectedOrder.contact_phone ? (
                        <p className="mt-2 text-sm leading-7 text-slate-700">{selectedOrder.contact_phone}</p>
                      ) : null}
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Phương thức</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {formatPaymentMethod(selectedOrder.payment_method, storeHoldDurationLabel)}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{selectedOrder.shipping_address}</p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Sản phẩm</p>
                    <div className="mt-4 space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={`${item.product_id}-${index}`} className="flex items-center justify-between gap-4 text-sm text-slate-700">
                          <span>{item.product_name} x {item.quantity} ({item.size}{item.color ? ` / ${item.color}` : ''})</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-slate-200 pt-4 text-right text-lg font-semibold text-slate-950">
                      Tổng cộng: {formatCurrency(selectedOrder.total_amount)}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <Field label="Trạng thái đơn">
                      <select
                        value={orderStatusDraft}
                        onChange={(event) => setOrderStatusDraft(event.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      >
                        {ORDER_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <div className="mt-4 rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-6 text-sky-800">
                      Khi admin đổi trạng thái, timeline theo dõi đơn của khách sẽ được cập nhật tương ứng ngay trên web.
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleUpdateOrderStatus}
                        disabled={orderStatusDraft === selectedOrder.status}
                        className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
                      >
                        Lưu trạng thái đơn
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Timeline hiện tại</p>
                    <div className="mt-4 space-y-3">
                      {(selectedOrder.trackingSteps || []).map((step) => (
                        <div
                          key={step.label}
                          className={`rounded-2xl border px-4 py-4 ${
                            step.active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          <p className="font-semibold">{step.label}</p>
                          <p className={`mt-2 text-sm leading-6 ${step.active ? 'text-slate-200' : 'text-slate-500'}`}>
                            {step.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
