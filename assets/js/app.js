
    // --- Constants & State ---
    // Application Version - Increment for each update
    const APP_VERSION = '1.1.0';

    // Extracted small helpers + DPI utilities into assets/js/modules/utils.js
    // (kept as window.* globals for now to minimize risk)
    // Update version display dynamically
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = `v${APP_VERSION}`;
    }
    document.title = `Image Library — Minimal Shell v${APP_VERSION}`;

    // Backend API base URL (provided by modules/api.js; fallback if not loaded)
    const API_URL = window.API_URL || ((window.location.origin.includes(':8080'))
        ? window.location.origin.replace(':8080', ':3000')
        : window.location.origin);
    window.API_URL = API_URL;
    const navLinks = {
        library: document.getElementById('nav-library'),
        upload: document.getElementById('nav-upload'),
        'upload-pattern': document.getElementById('nav-upload-pattern'),
        project: document.getElementById('nav-project'),
        'pattern-apply': document.getElementById('nav-pattern-apply'),
        admin: document.getElementById('nav-admin'),
    };

    // Broken image tracking
    let brokenImages = [];
    let brokenImageNotificationShown = false;
    let brokenImageNotificationDismissed = localStorage.getItem('brokenImageNotificationDismissed') === 'true';

    // Broken image functions
    function trackBrokenImage(imageId, imageSrc) {
        if (!brokenImages.find(img => img.id === imageId)) {
            brokenImages.push({ id: imageId, src: imageSrc });
            updateBrokenImageNotification();
        }
    }

    function updateBrokenImageNotification() {
        const notification = document.getElementById('broken-image-notification');
        const countElement = document.getElementById('broken-count');

        // Only show notification if user hasn't dismissed it permanently
        if (brokenImages.length > 0 && !brokenImageNotificationDismissed) {
            countElement.textContent = brokenImages.length;
            notification.classList.remove('hidden');

            // Log broken images for debugging
            console.warn(`${brokenImages.length} images failed to load:`, brokenImages);
        } else {
            notification.classList.add('hidden');
        }
    }

    function clearBrokenImageTracking() {
        brokenImages = [];
        updateBrokenImageNotification();
    }

    // Function to reset notification dismissal (for development/testing)
    function resetBrokenImageNotificationDismissal() {
        brokenImageNotificationDismissed = false;
        localStorage.removeItem('brokenImageNotificationDismissed');
        updateBrokenImageNotification();
        console.log('Broken image notification dismissal reset - notifications will show again');
    }
    const pages = {
        library: document.getElementById('page-library'),
        upload: document.getElementById('page-upload'),
        'upload-pattern': document.getElementById('page-upload-pattern'),
        project: document.getElementById('page-project'),
        'pattern-apply': document.getElementById('page-pattern-apply'),
        admin: document.getElementById('page-admin'),
    };
    const fileInput = document.getElementById('file-input');
    const previewGrid = document.getElementById('preview-grid');
    const clearAllButton = document.getElementById('clear-all');
    const dropzone = document.getElementById('dropzone');
    const subjInput = document.getElementById('subj-input');
    const subjChips = document.getElementById('subj-chips');
    const subjAutocompleteDropdown = document.getElementById('subj-autocomplete-dropdown');
    const subjFreqList = document.getElementById('subj-freq-list');
    const subjFreqSortBtn = document.getElementById('subj-freq-sort-btn');

    // Track frequency of subjective (feeling) tags in-memory
    const subjFreqMap = {};
    let subjToastTimeout = null;
    let subjFreqSortMode = 'frequency'; // 'frequency' or 'alphabetical'
    let lightboxFreqSortMode = 'frequency'; // 'frequency' or 'alphabetical' for lightbox
    let updateTagFreqSortMode = 'frequency'; // 'frequency' or 'alphabetical' for update tag modal

    // Objective metadata inputs
    const objBookInput = document.getElementById('obj-book');
    const objPageInput = document.getElementById('obj-page');
    const objRowInput = document.getElementById('obj-row');
    const objColumnInput = document.getElementById('obj-column');
    const objTypeInput = document.getElementById('obj-type');
    const objMaterialInput = document.getElementById('obj-material');
    const objWidthInput = document.getElementById('obj-width');
    const objLengthInput = document.getElementById('obj-length');
    const objRemarkInput = document.getElementById('obj-remark');
    const patternDropdownToggle = document.getElementById('pattern-dropdown-toggle');
    const patternDropdownMenu = document.getElementById('pattern-dropdown-menu');
    const patternDropdownOptions = document.getElementById('pattern-dropdown-options');
    const patternDropdownText = patternDropdownToggle ? patternDropdownToggle.querySelector('.pattern-dropdown-text') : null;
    let selectedPatternId = null;
    let selectedPatternData = null;
    const objBrandInput = document.getElementById('obj-brand');
    const objColorInput = document.getElementById('obj-color');
    const objChips = document.getElementById('obj-chips');
    const uploadPatternBtn = document.getElementById('upload-pattern-btn');
    const selectedPatternPreview = document.getElementById('selected-pattern-preview');
    const selectedPatternThumbnail = document.getElementById('selected-pattern-thumbnail');
    const selectedPatternName = document.getElementById('selected-pattern-name');
    const autoFillBtn = document.getElementById('auto-fill-btn');
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-image');
    const lightboxTags = document.getElementById('lightbox-tags');
    const closeModal = document.querySelector('.modal-close');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    const lightboxLockBtn = document.getElementById('lightbox-lock-btn');
    const lightboxSaveBtn = document.getElementById('lightbox-save-btn');
    const uploadButton = document.getElementById('upload-button');
    const librarySearchInput = document.getElementById('library-search-input');
    const libraryGrid = document.getElementById('library-grid');
    
    // Pagination state
    let currentPage = 0;
    let imagesPerRow = 0;
    let allImagesToDisplay = []; // Store all images for pagination
    const ROWS_PER_PAGE = 3;
    const librarySearchChips = document.getElementById('library-search-chips');
    const autocompleteDropdown = document.getElementById('autocomplete-dropdown');

    // Header title element for dynamic updates
    const libraryTitle = document.querySelector('#page-library .title');
    const clearAllTagsBtn = document.getElementById('clear-all-tags');
    const tagModeToggleBtn = document.getElementById('tag-mode-toggle');
    const exactWordToggleBtn = document.getElementById('exact-word-toggle');
    const patternToggleBtn = document.getElementById('pattern-toggle');
    
    // Tag search mode: 'OR' (default) or 'AND'
    let tagSearchMode = 'OR';
    // Tag match mode: exact word or partial/substring (default: partial for better search experience)
    let exactWordMode = false;
    // Pattern mode: when active, only search pattern tags (default: false)
    let patternMode = false;

    // Selection and project elements
    const selectionControls = document.getElementById('selection-controls');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const updateTagBtn = document.getElementById('update-tag-btn');
    const deleteImageBtn = document.getElementById('delete-image-btn');
    const viewPoolBtn = document.getElementById('view-pool-btn');
    const backToLibraryBtn = document.getElementById('back-to-library-btn');
    const addToProjectBtn = document.getElementById('add-to-project-btn');
    const selectionCount = document.getElementById('selection-count');
    const projectNameModal = document.getElementById('project-name-modal');
    const projectNameInput = document.getElementById('project-name-input');
    const cancelProjectBtn = document.getElementById('cancel-project-btn');
    const createProjectBtn = document.getElementById('create-project-btn');
    const projectList = document.getElementById('project-list');

    // Project created confirmation modal elements
    const projectCreatedModal = document.getElementById('project-created-modal');
    const projectSuccessMessage = document.getElementById('project-success-message');
    const addMoreProjectsBtn = document.getElementById('add-more-projects-btn');
    const goToProjectBtn = document.getElementById('go-to-project-btn');

    // Project search elements
    const projectSearchInput = document.getElementById('project-search-input');
    const projectFilterBtn = document.getElementById('project-filter-btn');

    // Project view toggle elements
    const projectViewToggleBtn = document.getElementById('project-view-toggle-btn');
    const toggleIcon = document.getElementById('toggle-icon');
    const toggleText = document.getElementById('toggle-text');

    // Project detail overlay elements
    const projectDetailModal = document.getElementById('project-detail-modal');
    const closeProjectDetailBtn = document.getElementById('close-project-detail');
    const projectDetailName = document.getElementById('project-detail-name');
    const projectDetailDate = document.getElementById('project-detail-date');
    const projectDetailCount = document.getElementById('project-detail-count');
    const projectDetailOwner = document.getElementById('project-detail-owner');
    const projectDetailTagsText = document.getElementById('project-detail-tags-text');
    const projectDetailGrid = document.getElementById('project-detail-grid');

    // Share project modal elements
    const shareProjectModal = document.getElementById('share-project-modal');
    const shareProjectClose = document.getElementById('share-project-close');
    const shareProjectName = document.getElementById('share-project-name');
    const shareEmailInput = document.getElementById('share-email-input');
    const shareMessageInput = document.getElementById('share-message-input');
    const cancelShareBtn = document.getElementById('cancel-share-btn');
    const sendShareBtn = document.getElementById('send-share-btn');
    const emailSendingOverlay = document.getElementById('email-sending-overlay');

    // Update tag modal elements
    const updateTagModal = document.getElementById('update-tag-modal');
    const updateTagClose = document.getElementById('update-tag-close');
    const selectedImagesList = document.getElementById('selected-images-list');
    const originalTagsList = document.getElementById('original-tags-list');
    const newTagsList = document.getElementById('new-tags-list');
    const newTagInput = document.getElementById('new-tag-input');
    const addNewTagBtn = document.getElementById('add-new-tag-btn');
    const removeAllTagsBtn = document.getElementById('remove-all-tags-btn');
    const tagWarning = document.getElementById('tag-warning');
    const updateTagCancel = document.getElementById('update-tag-cancel');
    const updateTagSave = document.getElementById('update-tag-save');

    // Delete image modal elements
    const deleteImageModal = document.getElementById('delete-image-modal');
    const deleteImageClose = document.getElementById('delete-image-close');
    const deleteCount = document.getElementById('delete-count');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const tagUpdateSuccessModal = document.getElementById('tag-update-success-modal');
    const tagUpdateContinueBtn = document.getElementById('tag-update-continue-btn');
    const tagRemovalNotificationModal = document.getElementById('tag-removal-notification-modal');
    const tagRemovalMessage = document.getElementById('tag-removal-message');
    const tagRemovalContinueBtn = document.getElementById('tag-removal-continue-btn');

    // Tag removal confirmation modal elements
    const tagRemovalConfirmModal = document.getElementById('tag-removal-confirm-modal');
    const tagRemovalConfirmClose = document.getElementById('tag-removal-confirm-close');
    const tagRemovalTagName = document.getElementById('tag-removal-tag-name');
    const tagRemovalImageCount = document.getElementById('tag-removal-image-count');
    const tagRemovalCancelBtn = document.getElementById('tag-removal-cancel-btn');
    const tagRemovalConfirmBtn = document.getElementById('tag-removal-confirm-btn');
    const tagDeleteConfirmModal = document.getElementById('tag-delete-confirm-modal');
    const tagDeleteName = document.getElementById('tag-delete-name');
    const tagDeleteCancelBtn = document.getElementById('tag-delete-cancel-btn');
    const tagDeleteConfirmBtn = document.getElementById('tag-delete-confirm-btn');
    let pendingTagDelete = null;

    // Delete uploaded image confirmation modal elements
    const deleteUploadImageConfirmModal = document.getElementById('delete-upload-image-confirm-modal');
    const deleteUploadImageCancelBtn = document.getElementById('delete-upload-image-cancel-btn');
    const deleteUploadImageConfirmBtn = document.getElementById('delete-upload-image-confirm-btn');

    // Unlock editing confirmation modal elements
    const unlockEditingConfirmModal = document.getElementById('unlock-editing-confirm-modal');
    const unlockEditingCancelBtn = document.getElementById('unlock-editing-cancel-btn');
    const unlockEditingConfirmBtn = document.getElementById('unlock-editing-confirm-btn');

    // Clear all confirmation modal elements
    const clearAllConfirmModal = document.getElementById('clear-all-confirm-modal');
    
    // Delete project confirmation modal elements
    const deleteProjectConfirmModal = document.getElementById('delete-project-confirm-modal');
    const deleteProjectConfirmClose = document.getElementById('delete-project-confirm-close');
    const deleteProjectName = document.getElementById('delete-project-name');
    const deleteProjectCancelBtn = document.getElementById('delete-project-cancel-btn');
    const deleteProjectConfirmBtn = document.getElementById('delete-project-confirm-btn');
    const clearAllConfirmClose = document.getElementById('clear-all-confirm-close');
    const clearAllSelectionCount = document.getElementById('clear-all-selection-count');
    const clearAllTagCount = document.getElementById('clear-all-tag-count');
    const clearAllCancelBtn = document.getElementById('clear-all-cancel-btn');
    const clearAllConfirmBtn = document.getElementById('clear-all-confirm-btn');

    // Image preview overlay elements
    const imagePreviewOverlay = document.getElementById('image-preview-overlay');
    const previewOverlayImg = document.getElementById('preview-overlay-img');
    const previewOverlayClose = document.getElementById('preview-overlay-close');
    const previewNavLeft = document.getElementById('preview-nav-left');
    const previewNavRight = document.getElementById('preview-nav-right');

    let filesToUpload = [];
    let currentImageIndex = 0;
    let imageSources = [];
    let libraryImages = []; // Store current library images for lightbox navigation
    let currentLightboxImages = []; // Track which image array is used for lightbox (libraryImages or allImagesToDisplay)
    let searchTags = []; // Store current search tags as chips
    let searchTagColors = {}; // Map tag text -> highlight color
    let usedSearchColors = new Set(); // Track used colors to avoid repeats
    let selectedImages = []; // Store selected image IDs for project creation
    let tagSelectedImages = []; // Store images selected by tags (always show tag icon)
    let imageSelectionSource = {}; // Track how each image was selected: 'manual' or search tag name

    // Update tag modal state
    let tagsToRemove = new Set(); // Track individual tags marked for removal
    let removeAllTags = false; // Track if "Remove All Tags" was clicked
    let tagsToAdd = new Set(); // Track new tags to be added
    let imageSelectionOrder = {}; // Track selection timestamps for ordering
    let tagCreationOrder = {}; // Track when each tag was first created/used
    let projects = []; // Store created projects
    let isPoolView = false; // Track if we're viewing selection pool
    let forceLibraryView = false; // Flag to prevent auto-switching to pool view
    let chipsReferenceOnly = false; // If true, visible chips are for display only and should not be used as active search tags
    let lastCreatedProject = null; // Store the last created project for navigation
    let isDetailedProjectView = false; // Track if we're in detailed project view mode
    let autocompleteVisible = false; // Track if autocomplete dropdown is visible
    let autocompleteHighlightIndex = -1; // Track highlighted item in autocomplete
    let autocompleteItems = []; // Store current autocomplete suggestions
    let currentUser = null; // Store current logged-in user

    // Selection Pool preview navigation
    let currentPreviewImages = []; // Array of images for navigation
    let currentPreviewIndex = 0; // Current image index in preview
    let isSelectionPoolPreview = false; // Track if we're in Selection Pool preview mode
    let pendingAddTags = new Set(); // Track tags added in lightbox before saving
    let pendingRemoveTags = new Set(); // Track tags removed in lightbox before saving
    let pendingPatternChange = null; // Track pattern change in lightbox before saving { patternName: string }
    let lightboxDirty = false; // Track if any tag was added or removed in lightbox
    let lightboxLocked = true; // Track if lightbox fields are locked (default: locked)
    let isProjectViewLightbox = false; // Track if lightbox is opened from project view (read-only mode)
    let searchPatterns = []; // Store patterns found from search

    // --- Function Definitions ---

    function groupImagesByTagsAndSort(images) {
        console.log('=== groupImagesByTagsAndSort START ===');
        console.log('Input images:', images.map(img => `${img.id}: [${img.tags?.join(',') || 'untagged'}] uploaded: ${img.uploadTime}`));
        console.log('Tag creation order:', tagCreationOrder);


        // Create groups by tag based on current search chips:
        // when chips are "#3 star", "#2 white", "#1 pink",
        // images should be grouped: all "star", then "white", then "pink".
        const result = [];

        // Prefer current chip DOM order (left → right) for grouping, so it always matches
        // what the user sees: "#3 star", "#2 white", "#1 pink" → [star, white, pink].
        let allInputTags = [];
        const chipContainer = document.getElementById('library-search-chips');
        if (chipContainer) {
            const chipNodes = Array.from(chipContainer.querySelectorAll('.search-chip'));
            allInputTags = chipNodes
                .map(chip => (chip.dataset.tag || '').toLowerCase())
                .filter(tag => tag);
        }

        // Fallback if no chips are present: use historical input order from tagCreationOrder (oldest first)
        if (allInputTags.length === 0) {
            allInputTags = Object.keys(tagCreationOrder).sort((a, b) => {
                const timestampA = tagCreationOrder[a] || 0;
                const timestampB = tagCreationOrder[b] || 0;
                return timestampA - timestampB;
            });
        }

        console.log('All input tags in reverse chronological order (latest input first):', allInputTags.map(tag => `${tag}: ${tagCreationOrder[tag]}`));

        // Track which images we've already added to prevent duplicates
        const addedImageIds = new Set();

        // For each tag (in the desired order), add ALL images that have this tag
        allInputTags.forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            const imagesWithThisTag = images.filter(image => {
                const imageTags = image.tags || [];
                return imageTags.some(t => {
                    const imageTagLower = t.toLowerCase();
                    // In exact mode, require full match; otherwise allow partial/substring match
                    return exactWordMode
                        ? imageTagLower === normalizedTag
                        : imageTagLower.includes(normalizedTag);
                });
            });

            // Sort images within this tag group by upload time (earliest first)
            imagesWithThisTag.sort((a, b) => {
                const uploadTimeA = a.uploadTime || 0;
                const uploadTimeB = b.uploadTime || 0;
                return uploadTimeA - uploadTimeB; // Earliest upload first
            });

            console.log(`Tag "${tag}" images:`, imagesWithThisTag.map(img =>
                `${img.id} (uploaded: ${img.uploadTime})`
            ));

            // Add these images to result (preventing duplicates across tag groups)
            imagesWithThisTag.forEach(image => {
                if (!addedImageIds.has(image.id)) {
                    result.push(image);
                    addedImageIds.add(image.id);
                }
            });
        });

        // Add ALL manually selected images that haven't been added yet (preserve manual selections)
        const manuallySelectedImages = images.filter(image => {
            const isManuallySelected = selectedImages.includes(image.id) && !tagSelectedImages.includes(image.id);
            return isManuallySelected && !addedImageIds.has(image.id);
        });

        console.log('Manually selected images not yet added:', manuallySelectedImages.map(img => `${img.id} (manual selection, tags: [${img.tags?.join(',') || 'untagged'}])`));

        // Add manually selected images at the end (preventing duplicates)
        manuallySelectedImages.forEach(image => {
            if (!addedImageIds.has(image.id)) {
                result.push(image);
                addedImageIds.add(image.id);
            }
        });

        // Add ALL tag-selected images that haven't been added yet
        const tagSelectedOnlyImages = images.filter(image => {
            const isTagSelected = tagSelectedImages.includes(image.id);
            return isTagSelected && !addedImageIds.has(image.id);
        });

        tagSelectedOnlyImages.forEach(image => {
            if (!addedImageIds.has(image.id)) {
                result.push(image);
                addedImageIds.add(image.id);
            }
        });

        console.log('Final sequence (with untagged manual selections):', result.map(img =>
            `${img.id}: [${img.tags?.join(',') || 'untagged'}] uploaded: ${img.uploadTime}`
        ));
        console.log('=== groupImagesByTagsAndSort END ===');

        // Show missing images in alert
        const missingImages = images.filter(img => !result.find(r => r.id === img.id));
        if (missingImages.length > 0) {
            alert('MISSING IMAGES FOUND:\n' +
                  'Input: ' + images.length + ' images\n' +
                  'Output: ' + result.length + ' images\n' +
                  'Missing IDs: ' + missingImages.map(img => img.id).join(', ') + '\n' +
                  'Missing tags: ' + JSON.stringify(missingImages.map(img => ({id: img.id, tags: img.tags})), null, 2));
        }

        return result;
    }

    function addTagGroupHeaders(images) {
        // Track which tags we've already added headers for
        const addedTagHeaders = new Set();
        const tagGroups = new Map();

        // Group images by ALL their tags (not just first tag)
        images.forEach(image => {
            const imageTags = image.tags || [];
            imageTags.forEach(tag => {
                if (!tagGroups.has(tag)) {
                    tagGroups.set(tag, []);
                }
                tagGroups.get(tag).push(image);
            });
        });

        // Add headers based on current search tags and all input tags
        const currentSearchTags = searchTags.map(tag => tag.text);

        // In pool view, show ALL search tags (green chips) that are currently active
        // In library view with search, show only matching tags
        const tagsToShow = isPoolView ? currentSearchTags :
                          currentSearchTags.length > 0 ? currentSearchTags :
                          Object.keys(tagCreationOrder).sort((a, b) => {
                              const timestampA = tagCreationOrder[a] || 0;
                              const timestampB = tagCreationOrder[b] || 0;
                              return timestampB - timestampA; // Latest tag first
                          });

        // Create a container for tag headers (button-style)
        const tagHeaderContainer = document.createElement('div');
        tagHeaderContainer.className = 'tag-headers-container';

        // Add headers for each tag that has images, showing all current search tags in pool view
        tagsToShow.forEach(tag => {
            // Skip the "car" tag to remove its header
            if (tag === 'car') {
                return;
            }

            const imagesWithThisTag = images.filter(image => {
                const imageTags = image.tags || [];
                return imageTags.includes(tag);
            });

            if (imagesWithThisTag.length > 0 && !addedTagHeaders.has(tag)) {
                const tagHeader = document.createElement('span');
                tagHeader.className = 'tag-group-header';
                tagHeader.textContent = `${tag} (${imagesWithThisTag.length})`;
                tagHeaderContainer.appendChild(tagHeader);
                addedTagHeaders.add(tag);
            }
        });

        // Add header for untagged images if any exist
        const untaggedImages = images.filter(image => {
            const imageTags = image.tags || [];
            return imageTags.length === 0;
        });

        if (untaggedImages.length > 0 && !addedTagHeaders.has('Untagged')) {
            const tagHeader = document.createElement('span');
            tagHeader.className = 'tag-group-header';
            tagHeader.textContent = 'Untagged Images';
            tagHeaderContainer.appendChild(tagHeader);
            addedTagHeaders.add('Untagged');
        }

        // Only add the container if it has headers
        if (tagHeaderContainer.children.length > 0) {
            libraryGrid.appendChild(tagHeaderContainer);
        }
    }

    function updateLibraryTitle(isPoolView = false) {
        if (isPoolView) {
            libraryTitle.textContent = 'Image Library (Selection Pool)';
        } else {
            libraryTitle.textContent = 'Image Library';
        }
    }

    function updateSearchInputVisibility() {
        const searchInput = document.getElementById('library-search-input');
        const clearAllBtn = document.getElementById('clear-all-tags');
        const libraryTitle = document.querySelector('#page-library .title');

        // Check if we're in Selection Pool view by multiple criteria
        const isSelectionPool = libraryTitle && libraryTitle.textContent.includes('Selection Pool');
        const hasTagSearch = searchTags.length > 0;
        const hasSelectedImages = selectedImages.length > 0;

        console.log('updateSearchInputVisibility - isPoolView:', isPoolView, 'isSelectionPool:', isSelectionPool, 'hasTagSearch:', hasTagSearch, 'hasSelectedImages:', hasSelectedImages);

        // Only disable search controls when explicitly in Selection Pool view
        if (isPoolView || isSelectionPool) {
            // DISABLE search input and clear button in Selection Pool view
            searchInput.disabled = true;
            clearAllBtn.disabled = true;

            // Add visual styling for disabled state
            searchInput.style.opacity = '0.5';
            searchInput.style.cursor = 'not-allowed';
            clearAllBtn.style.opacity = '0.5';
            clearAllBtn.style.cursor = 'not-allowed';

            console.log('Search input/clear DISABLED for Selection Pool view');
        } else {
            // ENABLE search controls in regular Library view
            searchInput.disabled = false;
            clearAllBtn.disabled = false;

            // Remove visual styling for disabled state
            searchInput.style.opacity = '1';
            searchInput.style.cursor = 'text';
            clearAllBtn.style.opacity = '1';
            clearAllBtn.style.cursor = 'pointer';

            console.log('Search controls ENABLED for regular Library view');
        }
    }

    // Calculate how many images fit per row based on grid width
    function calculateImagesPerRow() {
        if (!libraryGrid || libraryGrid.offsetWidth === 0) {
            // Fallback: estimate based on 150px card width + 8px gap
            imagesPerRow = Math.floor((window.innerWidth * 0.88) / 158); // 88% of viewport width
            return;
        }
        const gridWidth = libraryGrid.offsetWidth;
        const cardWidth = 150; // From CSS: grid-template-columns: repeat(auto-fill, 150px)
        const gap = 8; // From CSS: gap: 8px
        imagesPerRow = Math.floor((gridWidth + gap) / (cardWidth + gap));
        if (imagesPerRow < 1) imagesPerRow = 1; // Minimum 1 image per row
    }

    // Show loading skeleton cards
    function showLoadingSkeletons() {
        const skeletonCount = imagesPerRow * ROWS_PER_PAGE;
        for (let i = 0; i < skeletonCount; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'preview-card library-card skeleton-card';
            skeleton.innerHTML = '<div class="skeleton-shimmer"></div>';
            libraryGrid.appendChild(skeleton);
        }
    }

    // Global variable to track the current tag modal
    let currentTagModal = null;
    
    // Add CSS styles for tags hover modal
    function addTagsHoverModalStyles() {
        if (document.getElementById('tags-hover-modal-styles')) return; // Already added
        
        const style = document.createElement('style');
        style.id = 'tags-hover-modal-styles';
        style.textContent = `
            .tags-hover-modal {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                animation: fadeIn 0.2s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .tags-hover-modal-content {
                background: white;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                max-width: 300px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .tags-hover-modal-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 8px;
                color: #333;
                border-bottom: 1px solid #ddd;
                padding-bottom: 6px;
            }
            
            .tags-hover-modal-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            
            .tags-hover-tag {
                display: inline-block;
                background: #e8e8e8;
                color: #333;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
            }
            
            .tags-hover-tag-objective {
                background: #d4e8f7;
                color: #1a5490;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize styles on page load
    addTagsHoverModalStyles();
    
    // Add CSS styles to hide scrollbar on dropzone
    function addDropzoneScrollbarStyles() {
        if (document.getElementById('dropzone-scrollbar-styles')) return; // Already added
        
        const style = document.createElement('style');
        style.id = 'dropzone-scrollbar-styles';
        style.textContent = `
            #dropzone::-webkit-scrollbar {
                display: none !important;
            }
            #dropzone {
                -ms-overflow-style: none !important;
                scrollbar-width: none !important;
                overflow: auto !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize dropzone scrollbar styles on page load
    addDropzoneScrollbarStyles();

    // Add styles for pattern field
    function addPatternFieldStyles() {
        if (document.getElementById('pattern-field-styles')) return; // Already added
        
        const style = document.createElement('style');
        style.id = 'pattern-field-styles';
        style.textContent = `
            .pattern-field-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            .pattern-field-wrapper .tag-input {
                flex: 1;
                min-width: 200px;
            }
            .custom-pattern-dropdown {
                position: relative;
                width: 100%;
            }
            .pattern-dropdown-toggle {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                background: white;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .pattern-dropdown-toggle:hover {
                border-color: #999;
            }
            .pattern-dropdown-text {
                flex: 1;
            }
            .pattern-dropdown-arrow {
                margin-left: 10px;
                font-size: 12px;
                color: #666;
            }
            .pattern-dropdown-menu {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 4px;
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .pattern-dropdown-menu.is-hidden {
                display: none !important;
            }
            .pattern-dropdown-options {
                padding: 4px 0;
            }
            .pattern-dropdown-option {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .pattern-dropdown-option:hover {
                background-color: #f5f5f5;
            }
            .pattern-dropdown-option.selected {
                background-color: #e3f2fd;
                border-left: 3px solid #2196f3;
            }
            .pattern-option-thumbnail {
                width: 40px;
                height: 40px;
                flex-shrink: 0;
                border-radius: 4px;
                overflow: hidden;
                border: 1px solid #ddd;
                background: #f5f5f5;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .pattern-option-thumbnail img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .pattern-option-placeholder {
                font-size: 20px;
            }
            .pattern-option-name {
                flex: 1;
                font-size: 14px;
                color: #333;
            }
            .selected-pattern-preview {
                margin-top: 10px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
            }
            .selected-pattern-preview.is-hidden {
                display: none !important;
            }
            .pattern-preview-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .pattern-thumbnail-preview {
                width: 50px;
                height: 50px;
                object-fit: cover;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            .pattern-name-preview {
                font-weight: 500;
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize pattern field styles on page load
    addPatternFieldStyles();

    // Add styles for lightbox pattern dropdown
    function addLightboxPatternDropdownStyles() {
        if (document.getElementById('lightbox-pattern-dropdown-styles')) return; // Already added
        
        const style = document.createElement('style');
        style.id = 'lightbox-pattern-dropdown-styles';
        style.textContent = `
            .lightbox-pattern-dropdown-wrapper {
                width: 100%;
            }
            .lightbox-pattern-dropdown {
                position: relative;
                width: 100%;
            }
            .lightbox-pattern-dropdown-toggle {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                background: white;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-height: 20px;
            }
            .lightbox-pattern-dropdown-toggle:hover {
                border-color: #999;
            }
            .lightbox-pattern-dropdown-text {
                flex: 1;
            }
            .lightbox-pattern-dropdown-arrow {
                margin-left: 10px;
                font-size: 12px;
                color: #666;
            }
            .lightbox-pattern-dropdown-menu {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 4px;
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .lightbox-pattern-dropdown-menu.is-hidden {
                display: none !important;
            }
            .lightbox-pattern-dropdown-options {
                padding: 4px 0;
            }
            .lightbox-pattern-dropdown-option {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .lightbox-pattern-dropdown-option:hover {
                background-color: #f5f5f5;
            }
            .lightbox-pattern-dropdown-option.selected {
                background-color: #e3f2fd;
                border-left: 3px solid #2196f3;
            }
            .lightbox-pattern-option-thumbnail {
                width: 40px;
                height: 40px;
                flex-shrink: 0;
                border-radius: 4px;
                overflow: hidden;
                border: 1px solid #ddd;
                background: #f5f5f5;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .lightbox-pattern-option-thumbnail img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .lightbox-pattern-option-placeholder {
                font-size: 20px;
            }
            .lightbox-pattern-option-name {
                flex: 1;
                font-size: 14px;
                color: #333;
            }
            .lightbox-selected-pattern-preview {
                margin-top: 10px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
            }
            .lightbox-selected-pattern-preview.is-hidden {
                display: none !important;
            }
            .lightbox-pattern-preview-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .lightbox-pattern-thumbnail-preview {
                width: 50px;
                height: 50px;
                object-fit: cover;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            .lightbox-pattern-name-preview {
                font-weight: 500;
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize lightbox pattern dropdown styles on page load
    addLightboxPatternDropdownStyles();

    // Add styles for lightbox lock button
    function addLightboxLockButtonStyles() {
        if (document.getElementById('lightbox-lock-button-styles')) return; // Already added
        
        const style = document.createElement('style');
        style.id = 'lightbox-lock-button-styles';
        style.textContent = `
            .lightbox-lock-btn {
                position: fixed;
                top: 20px;
                right: 70px;
                z-index: 1001;
                background: #dc3545;
                border: 2px solid #dc3545;
                border-radius: 50%;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                padding: 0;
            }
            
            .lightbox-lock-btn:hover {
                background: #c82333;
                border-color: #c82333;
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .lightbox-lock-btn:active {
                transform: scale(0.95);
            }
            
            .lightbox-lock-btn.is-hidden {
                display: none !important;
            }
            
            .lightbox-lock-btn .lock-icon {
                width: 20px;
                height: 20px;
                stroke: #fff;
                fill: none;
                transition: stroke 0.3s ease;
            }
            
            .lightbox-lock-btn.unlocked {
                background: #28a745;
                border-color: #28a745;
                right: 120px;
            }
            
            .lightbox-lock-btn.unlocked:hover {
                background: #218838;
                border-color: #218838;
            }
            
            .lightbox-lock-btn.unlocked .lock-icon {
                stroke: #fff;
            }
            
            .lightbox-save-btn {
                position: fixed;
                top: 20px;
                right: 70px;
                z-index: 1001;
                background: #007bff;
                border: 2px solid #007bff;
                border-radius: 50%;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                padding: 0;
            }
            
            .lightbox-save-btn:hover {
                background: #0056b3;
                border-color: #0056b3;
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .lightbox-save-btn:active {
                transform: scale(0.95);
            }
            
            .lightbox-save-btn.is-hidden {
                display: none !important;
            }
            
            .lightbox-save-btn .save-icon {
                width: 20px;
                height: 20px;
                stroke: #fff;
                fill: none;
                transition: stroke 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize lightbox lock button styles on page load
    addLightboxLockButtonStyles();

    // Show modal with all tags on hover
    function showAllTagsModal(card, image, event) {
        // Remove any existing modal first
        hideAllTagsModal();
        
        const allTags = image.tags || [];
        if (allTags.length === 0) return; // Don't show modal if no tags
        
        // Separate subjective tags and pattern tags
        const objectivePrefixes = ['width:', 'length:', 'book:', 'page:', 'row:', 'column:', 'type:', 'material:', 'remark:', 'brand:', 'color:'];
        const subjectiveTags = [];
        const patternTags = [];
        
        allTags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            if (tagLower.startsWith('pattern:')) {
                patternTags.push(tag);
            } else if (!objectivePrefixes.some(prefix => tagLower.startsWith(prefix))) {
                subjectiveTags.push(tag);
            }
        });
        
        // Combine tags: subjective first, then pattern tags (pattern tags will be last)
        const tagsToShow = [...subjectiveTags, ...patternTags];
        
        // Don't show modal if no tags to display
        if (tagsToShow.length === 0) return;
        
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'tags-hover-modal';
        modal.id = 'tags-hover-modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'tags-hover-modal-content';
        
        // Add title
        const title = document.createElement('div');
        title.className = 'tags-hover-modal-title';
        title.textContent = 'Tags';
        modalContent.appendChild(title);
        
        // Add tags container
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-hover-modal-tags';

        // Get current search tags for highlighting
        const currentSearchTags = getActiveSearchTagTexts();

        // Add tags (subjective tags first, pattern tags last)
        tagsToShow.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tags-hover-tag';

            // Check if this is a pattern tag
            const isPatternTag = tag.toLowerCase().startsWith('pattern:');
            
            // Apply blue background for pattern tags
            if (isPatternTag) {
                tagElement.style.backgroundColor = '#007bff';
                tagElement.style.color = '#fff';
                tagElement.style.border = '1px solid #0056b3';
            }

            // Check if this tag matches any of the search tags
            const tagLower = tag.toLowerCase();

            // Find all matching search terms in this tag
            const matchingSearchTerms = currentSearchTags.filter(searchTag => {
                const searchLower = searchTag.toLowerCase();
                if (!searchLower) return false;
                return exactWordMode
                    ? tagLower === searchLower
                    : tagLower.includes(searchLower);
            });

            if (matchingSearchTerms.length > 0) {
                // Add thicker border to the whole tag element
                tagElement.style.border = '2px solid #ffd700';
                tagElement.style.boxShadow = '0 0 4px rgba(255, 215, 0, 0.5)';

                // In exact word mode, highlight the whole tag
                if (exactWordMode) {
                    // For pattern tags, keep blue background but add gold border
                    if (!isPatternTag) {
                        tagElement.style.backgroundColor = '#ffd700';
                        tagElement.style.color = '#000';
                    }
                    tagElement.style.fontWeight = '600';
                    tagElement.textContent = tag;
                } else {
                    // In partial mode, highlight the matching substrings
                    // Sort by length descending to match longer terms first
                    const sortedTerms = matchingSearchTerms
                        .map(t => t.toLowerCase())
                        .sort((a, b) => b.length - a.length);

                    // Build a regex to find all occurrences of matching terms
                    const escapedTerms = sortedTerms.map(term =>
                        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    );
                    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

                    // Replace matches with highlighted spans
                    const highlightedHTML = tag.replace(regex, '<mark style="background-color: #ffd700; color: #000; font-weight: 600; padding: 0;">$1</mark>');
                    tagElement.innerHTML = highlightedHTML;
                }
            } else {
                tagElement.textContent = tag;
            }

            tagsContainer.appendChild(tagElement);
        });
        
        modalContent.appendChild(tagsContainer);
        modal.appendChild(modalContent);
        
        // Append to body
        document.body.appendChild(modal);
        currentTagModal = modal;
        
        // Position modal near the cursor
        const rect = card.getBoundingClientRect();
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        
        modal.style.left = `${x}px`;
        modal.style.top = `${y}px`;
        
        // Adjust if modal goes off screen
        setTimeout(() => {
            const modalRect = modal.getBoundingClientRect();
            if (modalRect.right > window.innerWidth) {
                modal.style.left = `${x - modalRect.width - 20}px`;
            }
            if (modalRect.bottom > window.innerHeight) {
                modal.style.top = `${y - modalRect.height - 20}px`;
            }
        }, 0);
    }

    // Hide the tags modal
    function hideAllTagsModal() {
        if (currentTagModal) {
            currentTagModal.remove();
            currentTagModal = null;
        }
    }

    // Create a pattern card
    function createPatternCard(pattern, index, patternSrc, currentSearchTags) {
        const card = document.createElement('div');
        card.className = 'preview-card library-card pattern-card';
        card.dataset.patternId = pattern.id;
        card.dataset.isPattern = 'true';

        const img = document.createElement('img');
        img.src = patternSrc;
        img.style.cursor = 'pointer';
        
        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Patterns are not selectable like images, but can be clicked to view
            console.log('Pattern clicked:', pattern.id);
        });

        card.appendChild(img);

        // Add hover event listeners to show tags modal
        let hoverTimeout;
        card.addEventListener('mouseenter', (e) => {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                showPatternTagsModal(card, pattern, e);
            }, 300);
        });
        
        card.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            hideAllTagsModal();
        });

        // Add pattern indicator badge
        const patternBadge = document.createElement('div');
        patternBadge.className = 'pattern-badge';
        patternBadge.textContent = 'PATTERN';
        patternBadge.style.cssText = 'position: absolute; top: 8px; right: 8px; background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; z-index: 10;';
        card.appendChild(patternBadge);

        // Add tag overlay if pattern has tags
        const patternTags = pattern.tags || [];
        if (patternTags.length > 0) {
            const tagOverlay = document.createElement('div');
            tagOverlay.className = 'tag-overlay';
            
            const matchingTags = getMatchingTags(patternTags, currentSearchTags);
            if (matchingTags.length > 0) {
                tagOverlay.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
                tagOverlay.textContent = matchingTags.join(', ');
            } else {
                tagOverlay.style.backgroundColor = 'rgba(0, 123, 255, 0.8)';
                tagOverlay.textContent = patternTags.slice(0, 3).join(', ') + (patternTags.length > 3 ? '...' : '');
            }
            card.appendChild(tagOverlay);
        }

        return card;
    }

    // Show pattern tags modal on hover
    function showPatternTagsModal(card, pattern, event) {
        // Reuse the same modal structure as images
        if (currentTagModal) {
            currentTagModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'tags-hover-modal';
        const modalContent = document.createElement('div');
        modalContent.className = 'tags-hover-modal-content';
        
        const title = document.createElement('div');
        title.className = 'tags-hover-modal-title';
        title.textContent = 'Pattern Tags';
        modalContent.appendChild(title);
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-hover-modal-tags';

        const currentSearchTags = getActiveSearchTagTexts();
        const patternTags = pattern.tags || [];

        patternTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tags-hover-tag';
            tagElement.style.backgroundColor = '#007bff';
            tagElement.style.color = '#fff';

            const tagLower = tag.toLowerCase();
            const matchingSearchTerms = currentSearchTags.filter(searchTag => {
                const searchLower = searchTag.toLowerCase();
                if (!searchLower) return false;
                return exactWordMode
                    ? tagLower === searchLower
                    : tagLower.includes(searchLower);
            });

            if (matchingSearchTerms.length > 0) {
                tagElement.style.border = '2px solid #ffd700';
                tagElement.style.boxShadow = '0 0 4px rgba(255, 215, 0, 0.5)';
            }

            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
        
        modalContent.appendChild(tagsContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        currentTagModal = modal;
        
        const rect = card.getBoundingClientRect();
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        
        modal.style.left = `${x}px`;
        modal.style.top = `${y}px`;
        
        setTimeout(() => {
            const modalRect = modal.getBoundingClientRect();
            if (modalRect.right > window.innerWidth) {
                modal.style.left = `${x - modalRect.width - 20}px`;
            }
            if (modalRect.bottom > window.innerHeight) {
                modal.style.top = `${y - modalRect.height - 20}px`;
            }
        }, 0);
    }

    // Create an image card (normal or greyscale indicator)
    function createImageCard(image, index, imageSrc, currentSearchTags, isGreyscaleIndicator = false) {
        const card = document.createElement('div');
        card.className = 'preview-card library-card';
        card.dataset.imageId = image.id;
        
        if (isGreyscaleIndicator) {
            card.classList.add('greyscale-indicator');
        }

        const img = document.createElement('img');
        img.src = imageSrc;
        
        if (isGreyscaleIndicator) {
            // Greyscale images are non-clickable visual indicators
            img.style.filter = 'grayscale(100%)';
            img.style.opacity = '0.6';
            img.style.pointerEvents = 'none';
            card.style.pointerEvents = 'none';
            card.style.cursor = 'default';
        } else {
            // Normal images are clickable
            img.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Image clicked:', image.id, 'isPoolView:', isPoolView, 'index:', index);
                toggleImageSelection(image.id, card);
            });
            img.style.cursor = 'pointer';
            if (isPoolView) {
                card.style.cursor = 'pointer';
            }
        }

        card.appendChild(img);
        
        // Add hover event listeners to show all tags modal
        if (!isGreyscaleIndicator) {
            let hoverTimeout;
            let tagModal = null;
            
            card.addEventListener('mouseenter', (e) => {
                // Clear any existing timeout
                clearTimeout(hoverTimeout);
                
                // Create modal after a short delay to avoid flickering
                hoverTimeout = setTimeout(() => {
                    showAllTagsModal(card, image, e);
                }, 300); // 300ms delay
            });
            
            card.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
                hideAllTagsModal();
            });
        }
        
        // Add "chosen" overlay text for greyscale indicators (after image so it appears on top)
        if (isGreyscaleIndicator) {
            const chosenOverlay = document.createElement('div');
            chosenOverlay.className = 'chosen-overlay';
            chosenOverlay.textContent = 'chosen';
            card.appendChild(chosenOverlay);
        }

        // Add hover tooltip for width/length dimensions
        if (image.width || image.length) {
            const dimensionTooltip = document.createElement('div');
            dimensionTooltip.className = 'dimension-tooltip';
            const widthText = image.width ? `Width: ${image.width}` : '';
            const lengthText = image.length ? `Length: ${image.length}` : '';
            const separator = (widthText && lengthText) ? ' | ' : '';
            dimensionTooltip.textContent = widthText + separator + lengthText;
            card.appendChild(dimensionTooltip);
        }

        // Add eye icon and ruler icon for image preview (only for non-greyscale images)
        if (!isGreyscaleIndicator) {
            // 1:1 icon (original pixel size)
            const eyeIcon = document.createElement('div');
            eyeIcon.className = 'image-preview-eye';
            eyeIcon.textContent = '1:1';
            eyeIcon.title = 'Preview full size image';

            eyeIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const libraryTitle = document.querySelector('#page-library .title');
                const isSelectionPoolView = isPoolView || (libraryTitle && libraryTitle.textContent.includes('Selection Pool'));

                console.log('Lens clicked - isPoolView:', isPoolView, 'isSelectionPoolView:', isSelectionPoolView);

                if (isSelectionPoolView) {
                    console.log('Opening Selection Pool preview for image:', image.id, 'at index:', index);
                    showSelectionPoolPreview(image, allImagesToDisplay, index);
                } else {
                    console.log('Opening regular library preview for image:', image.id);
                    showImagePreviewOverlay(imageSrc, image);
                }
            });

            card.appendChild(eyeIcon);

            // Ruler icon (real size based on mm dimensions)
            if (image.width || image.length) {
                const rulerIcon = document.createElement('div');
                rulerIcon.className = 'image-preview-ruler';
                rulerIcon.innerHTML = '📏';
                rulerIcon.title = 'Preview real size (1:1 based on dimensions)';

                rulerIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Ruler clicked - showing real size for image:', image.id);
                    showRealSizeOverlay(imageSrc, image);
                });

                card.appendChild(rulerIcon);
            }
        }

        // Add booklet icon for lightbox preview (only in Selection Pool view and non-greyscale)
        if (isPoolView && !isGreyscaleIndicator) {
            const bookletIcon = document.createElement('div');
            bookletIcon.className = 'image-preview-booklet';
            bookletIcon.textContent = '📖';
            bookletIcon.title = 'Open lightbox with navigation';

            bookletIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Booklet clicked, opening lightbox for index:', index);
                openLibraryLightbox(index);
            });

            card.appendChild(bookletIcon);
        }

        // Add tag overlay - show only subjective tags (exclude objective metadata like width/length)
        // If we're rendering the "Other Images" section, chipsReferenceOnly will be true and
        // getActiveSearchTagTexts() will return [] so we do not highlight non-matching cards.
        const effectiveSearchTags = chipsReferenceOnly ? [] : currentSearchTags;
        const matchingTags = getMatchingTags(image.tags || [], effectiveSearchTags);
        const allImageTags = image.tags || [];
        
        // Filter out objective metadata tags (width, length, book, page, row, column, type, material, remark, brand, color)
        // BUT include pattern: tags since they are searchable
        const objectivePrefixes = ['width:', 'length:', 'book:', 'page:', 'row:', 'column:', 'type:', 'material:', 'remark:', 'brand:', 'color:'];
        const subjectiveTags = allImageTags.filter(tag => {
            const tagLower = tag.toLowerCase();
            // Include pattern: tags and tags without colons (subjective tags)
            return tagLower.startsWith('pattern:') || (!tagLower.includes(':') && !objectivePrefixes.some(prefix => tagLower.startsWith(prefix)));
        });

        const isAndMode = (tagSearchMode === 'AND');

        // Sync exactWordMode with button state before matching logic
        if (exactWordToggleBtn) {
            const buttonIsActive = exactWordToggleBtn.classList.contains('is-active');
            if (exactWordMode !== buttonIsActive) {
                console.warn('[SYNC] exactWordMode out of sync! Variable:', exactWordMode, 'Button:', buttonIsActive);
                exactWordMode = buttonIsActive;
            }
        }

        let matchesAllSearchTags = false;
        if (effectiveSearchTags.length > 0) {
            const subjectiveImageTags = allImageTags
                .map(t => t.toLowerCase())
                .filter(t => !t.includes(':') && !objectivePrefixes.some(prefix => t.startsWith(prefix)));

            // Include pattern: tags in matching check
            const searchableImageTags = allImageTags
                .map(t => t.toLowerCase())
                .filter(t => {
                    // Include pattern: tags and tags without colons (subjective tags)
                    return t.startsWith('pattern:') || (!t.includes(':') && !objectivePrefixes.some(prefix => t.startsWith(prefix)));
                });

            matchesAllSearchTags = effectiveSearchTags.every(searchTag => {
                const searchLower = searchTag.toLowerCase();
                if (!searchLower) return false;
                return searchableImageTags.some(imageTag => {
                    return exactWordMode
                        ? imageTag === searchLower
                        : imageTag.includes(searchLower);
                });
            });
        }

        const isTagSelected = isAndMode ? matchesAllSearchTags : tagSelectedImages.includes(image.id);

        if (subjectiveTags.length > 0) {
            const tagOverlay = document.createElement('div');
            tagOverlay.className = 'tag-overlay';

            // Check matching tags (including pattern: tags)
            // matchingTags already includes pattern: tags from getMatchingTags function
            const matchingSubjectiveTags = matchingTags; // Already filtered in getMatchingTags

            // Always show all tags (or first 3 + count), but highlight if there are matches.
            // The overlay color should follow the GROUP tag (earliest chip the image matches),
            // so all images in the same group share the same box color.
            // In AND mode, we rely on backend tagSelectedImages: only those images
            // should be highlighted as true matches of all tags.
            const shouldHighlight = tagSearchMode === 'AND'
                ? isTagSelected && matchingSubjectiveTags.length > 0
                : matchingSubjectiveTags.length > 0;

            // Never highlight cards in the "Other Images" section.
            // (They should be neutral/blank even if their tags contain the search terms.)
            if (chipsReferenceOnly) {
                // Ensure any previous styling doesn't leak
                card.style.outline = '';
                card.style.outlineOffset = '';
                card.style.boxShadow = '';
            }

            if (shouldHighlight) {
                tagOverlay.classList.add('has-matches');

                // Determine primary/group tag from chip order (left → right)
                let primaryTagLower = null;
                const chipContainer = document.getElementById('library-search-chips');
                if (chipContainer) {
                    const chipNodes = Array.from(chipContainer.querySelectorAll('.search-chip'));
                    const chipTagsInOrder = chipNodes
                        .map(chip => (chip.dataset.tag || '').toLowerCase())
                        .filter(tag => tag);

                    for (const chipTag of chipTagsInOrder) {
                        if (matchingSubjectiveTags.some(mt => {
                            const mtLower = mt.toLowerCase();
                            // Match if tag equals chip tag, or if pattern:tag contains chip tag (e.g., "pattern:twill" contains "twill")
                            if (exactWordMode) {
                                return mtLower === chipTag || (mtLower.startsWith('pattern:') && mtLower.substring(8) === chipTag);
                            } else {
                                return mtLower.includes(chipTag) || (mtLower.startsWith('pattern:') && mtLower.includes(chipTag));
                            }
                        })) {
                            primaryTagLower = chipTag;
                            break;
                        }
                    }
                }

                let overlayColor = null;
                if (primaryTagLower && searchTagColors[primaryTagLower]) {
                    overlayColor = searchTagColors[primaryTagLower];
                }

                // Fallback: first matching SEARCH TAG color
                if (!overlayColor) {
                    for (const st of currentSearchTags) {
                        const stLower = (st || '').toLowerCase();
                        if (!stLower) continue;
                        const c = searchTagColors[stLower];
                        if (!c) continue;
                        const hasMatch = matchingSubjectiveTags.some(mt => {
                            const mtLower = mt.toLowerCase();
                            // Match if tag equals search tag, or if pattern:tag contains search tag (e.g., "pattern:twill" contains "twill")
                            if (exactWordMode) {
                                return mtLower === stLower || (mtLower.startsWith('pattern:') && mtLower.substring(8) === stLower);
                            } else {
                                return mtLower.includes(stLower) || (mtLower.startsWith('pattern:') && mtLower.includes(stLower));
                            }
                        });
                        if (hasMatch) {
                            overlayColor = c;
                            break;
                        }
                    }
                }

                if (overlayColor) {
                    tagOverlay.style.backgroundColor = overlayColor;
                    tagOverlay.style.color = '#ffffff';
                }
            }

            // Compute how many SEARCH TAGS this image matches so we can
            // detect duplicates across tags (e.g. image matches both "red" and "text").
            let matchingSearchTagsCount = 0;
            if (effectiveSearchTags.length > 0) {
                const imageTagLower = allImageTags.map(t => t.toLowerCase());
                // Count matches against searchable tags (subjective tags + pattern: tags)
                const searchableImageTagsForCount = imageTagLower.filter(t =>
                    t.startsWith('pattern:') || (!t.includes(':') && !objectivePrefixes.some(prefix => t.startsWith(prefix)))
                );

                matchingSearchTagsCount = effectiveSearchTags.filter(searchTag => {
                    const searchLower = searchTag.toLowerCase();
                    if (!searchLower) return false;
                    return searchableImageTagsForCount.some(imageTag => {
                        // Match if tag equals search tag, OR if pattern:tag matches the search tag portion
                        if (exactWordMode) {
                            return imageTag === searchLower || (imageTag.startsWith('pattern:') && imageTag.substring(8) === searchLower);
                        }
                        return imageTag.includes(searchLower) || (imageTag.startsWith('pattern:') && imageTag.includes(searchLower));
                    });
                }).length;
            }

            // If this image matches more than one active SEARCH TAG,
            // we treat it as a "duplicate across tags" only in OR mode.
            const isDuplicateAcrossTags = (tagSearchMode === 'OR') && matchingSearchTagsCount > 1;
            const isAndAllTagsMatch = (tagSearchMode === 'AND') && isTagSelected && currentSearchTags.length > 1;
            const maxTagsToShow = 3;
            const tagsToShow = subjectiveTags.slice(0, maxTagsToShow);

            // Clear any default text and build tag chips (so matched tags can be color-coded)
            tagOverlay.textContent = '';

            // Helper to resolve which search chip color a given tag belongs to
            const getChipColorForTag = (tagLower) => {
                const chipContainer = document.getElementById('library-search-chips');
                const chipTagsInOrder = chipContainer
                    ? Array.from(chipContainer.querySelectorAll('.search-chip'))
                        .map(chip => (chip.dataset.tag || '').toLowerCase())
                        .filter(Boolean)
                    : [];

                // Respect chip order: first chip that matches wins
                for (const chipTag of chipTagsInOrder) {
                    const matchesChip = exactWordMode
                        ? (tagLower === chipTag || (tagLower.startsWith('pattern:') && tagLower.substring(8) === chipTag))
                        : (tagLower.includes(chipTag) || (tagLower.startsWith('pattern:') && tagLower.includes(chipTag)));
                    if (matchesChip && searchTagColors[chipTag]) {
                        return searchTagColors[chipTag];
                    }
                }

                // Fallback: any searchTagColors match
                for (const st of effectiveSearchTags) {
                    const stLower = (st || '').toLowerCase();
                    if (!stLower) continue;
                    const matches = exactWordMode
                        ? (tagLower === stLower || (tagLower.startsWith('pattern:') && tagLower.substring(8) === stLower))
                        : (tagLower.includes(stLower) || (tagLower.startsWith('pattern:') && tagLower.includes(stLower)));
                    if (matches && searchTagColors[stLower]) {
                        return searchTagColors[stLower];
                    }
                }

                return null;
            };

            // Reorder so tags that match the search appear first
            const matchTags = [];
            const otherTags = [];
            tagsToShow.forEach(tag => {
                const tagLower = tag.toLowerCase();
                const matchesSearchTag = effectiveSearchTags.some(searchTag => {
                    const searchLower = searchTag.toLowerCase();
                    if (!searchLower) return false;
                    return exactWordMode
                        ? (tagLower === searchLower || (tagLower.startsWith('pattern:') && tagLower.substring(8) === searchLower))
                        : (tagLower.includes(searchLower) || (tagLower.startsWith('pattern:') && tagLower.includes(searchLower)));
                });
                (matchesSearchTag ? matchTags : otherTags).push(tag);
            });
            const orderedTags = [...matchTags, ...otherTags];

            orderedTags.forEach(tag => {
                const chip = document.createElement('span');
                chip.className = 'tag-chip';
                chip.textContent = tag;

                const tagLower = tag.toLowerCase();
                const matchesSearchTag = effectiveSearchTags.some(searchTag => {
                    const searchLower = searchTag.toLowerCase();
                    if (!searchLower) return false;
                    return exactWordMode
                        ? (tagLower === searchLower || (tagLower.startsWith('pattern:') && tagLower.substring(8) === searchLower))
                        : (tagLower.includes(searchLower) || (tagLower.startsWith('pattern:') && tagLower.includes(searchLower)));
                });

                if (!chipsReferenceOnly && matchesSearchTag) {
                    chip.classList.add('is-match');
                    const color = getChipColorForTag(tagLower);
                    if (color) {
                        chip.style.backgroundColor = color;
                    }
                } else {
                    chip.classList.add('is-neutral');
                }

                tagOverlay.appendChild(chip);
            });

            if (subjectiveTags.length > maxTagsToShow) {
                const moreChip = document.createElement('span');
                moreChip.className = 'tag-chip is-neutral';
                moreChip.textContent = `+${subjectiveTags.length - maxTagsToShow}`;
                tagOverlay.appendChild(moreChip);
            }

            // Extra visual highlight for duplicate images across tags (OR) and all-tags matches (AND)
            if (!chipsReferenceOnly && isDuplicateAcrossTags) {
                // Strong red outline + glow
                card.style.outline = '3px solid red';
                card.style.outlineOffset = '3px';
                card.style.boxShadow = '0 0 8px rgba(255,0,0,0.7)';
            }

            if (isDuplicateAcrossTags || isAndAllTagsMatch) {
                // Small "DUP" badge in the top-left corner
                card.style.position = card.style.position || 'relative';
                const dupBadge = document.createElement('div');
                dupBadge.textContent = 'DUP';
                dupBadge.style.position = 'absolute';
                dupBadge.style.top = '4px';
                dupBadge.style.left = '4px';
                dupBadge.style.padding = '2px 4px';
                dupBadge.style.fontSize = '10px';
                dupBadge.style.fontWeight = '600';
                dupBadge.style.backgroundColor = 'rgba(255,0,0,0.9)';
                dupBadge.style.color = '#ffffff';
                dupBadge.style.borderRadius = '3px';
                dupBadge.style.zIndex = '2';
                tagOverlay.appendChild(dupBadge);
            }

            card.appendChild(tagOverlay);
        }

        // Add creator email display (only for non-greyscale images)
        if (!isGreyscaleIndicator && image.ownership) {
            const creatorOverlay = document.createElement('div');
            creatorOverlay.className = 'creator-overlay';
            const emailPrefix = window.getEmailPrefix(image.ownership);
            creatorOverlay.textContent = emailPrefix;
            creatorOverlay.title = `Created by: ${image.ownership}`;
            card.appendChild(creatorOverlay);
        }

        // Handle selection state (only for non-greyscale images)
        if (!isGreyscaleIndicator) {
            const wasAlreadySelected = selectedImages.includes(image.id) || tagSelectedImages.includes(image.id);
            const hasMatchingTags = (tagSearchMode === 'OR') && currentSearchTags.length > 0 && (matchingTags.length > 0 || tagSelectedImages.includes(image.id));

            // Debug for happy image
            if (image.tags && image.tags.some(t => t.toLowerCase() === 'happy')) {
                console.log('[HAPPY DEBUG]', {
                    imageId: image.id,
                    wasAlreadySelected,
                    isInTagSelectedImages: tagSelectedImages.includes(image.id),
                    tagSearchMode,
                    currentSearchTags,
                    isAndMode,
                    isTagSelected,
                    hasMatchingTags
                });
            }

            // In AND mode, treat "has matching tags" only when image matches ALL active tags.
            const effectiveHasMatchingTags = isAndMode
                ? isTagSelected
                : hasMatchingTags;

            // In AND mode with active tags, only true AND matches should appear selected.
            const shouldShowSelected = (isAndMode && currentSearchTags.length > 0)
                ? (effectiveHasMatchingTags || tagSelectedImages.includes(image.id))
                : (wasAlreadySelected || effectiveHasMatchingTags || tagSelectedImages.includes(image.id));

            // Handle selection logic (same for both pool view and library view)
            if (shouldShowSelected) {
                card.classList.add('selected');

                // Add pool-view class if in pool view for styling
                if (isPoolView) {
                    card.classList.add('pool-view');
                }

                // Add visual indicator for selection type - prioritize tag selection
                card.classList.remove('manual-selection', 'tag-selection');
                if (effectiveHasMatchingTags) {
                    card.classList.add('tag-selection');
                } else if (wasAlreadySelected) {
                    card.classList.add('manual-selection');
                }
            }

            // Apply per-tag highlight color to the card outline based on matching tags.
            // Use the same primary/group tag logic so outline color matches the group color.
            // In AND mode, only apply border if image matches ALL tags (use effectiveHasMatchingTags)
            const shouldApplyBorder = isAndMode ? effectiveHasMatchingTags : (matchingTags.length > 0);
            if (shouldApplyBorder) {
                let primaryTagLower = null;
                const chipContainer = document.getElementById('library-search-chips');
                if (chipContainer) {
                    const chipNodes = Array.from(chipContainer.querySelectorAll('.search-chip'));
                    const chipTagsInOrder = chipNodes
                        .map(chip => (chip.dataset.tag || '').toLowerCase())
                        .filter(tag => tag);

                    for (const chipTag of chipTagsInOrder) {
                        if (matchingTags.some(mt => {
                            const mtLower = mt.toLowerCase();
                            // Match if tag equals chip tag, or if pattern:tag contains chip tag (e.g., "pattern:twill" contains "twill")
                            if (exactWordMode) {
                                return mtLower === chipTag || (mtLower.startsWith('pattern:') && mtLower.substring(8) === chipTag);
                            } else {
                                return mtLower.includes(chipTag) || (mtLower.startsWith('pattern:') && mtLower.includes(chipTag));
                            }
                        })) {
                            primaryTagLower = chipTag;
                            break;
                        }
                    }
                }

                let cardColor = null;
                if (primaryTagLower && searchTagColors[primaryTagLower]) {
                    cardColor = searchTagColors[primaryTagLower];
                }

                // Fallback: first matching SEARCH TAG color
                if (!cardColor) {
                    for (const st of currentSearchTags) {
                        const stLower = (st || '').toLowerCase();
                        if (!stLower) continue;
                        const c = searchTagColors[stLower];
                        if (!c) continue;
                        const hasMatch = matchingTags.some(mt => {
                            const mtLower = mt.toLowerCase();
                            // Match if tag equals search tag, or if pattern:tag contains search tag (e.g., "pattern:twill" contains "twill")
                            if (exactWordMode) {
                                return mtLower === stLower || (mtLower.startsWith('pattern:') && mtLower.substring(8) === stLower);
                            } else {
                                return mtLower.includes(stLower) || (mtLower.startsWith('pattern:') && mtLower.includes(stLower));
                            }
                        });
                        if (hasMatch) {
                            cardColor = c;
                            break;
                        }
                    }
                }

                if (cardColor) {
                    card.style.outline = `3px solid ${cardColor}`;
                    card.style.outlineOffset = '2px';
                }
            }
        }

        return card;
    }

    // Helper function to ensure separators exist and are in the correct position
    function ensureSeparatorsExist(loadedImages, currentSearchTags, allSelectedImageIds) {
        // Check if separators already exist
        const existingMatchedHeader = libraryGrid.querySelector('.results-separator--matched');
        const existingOtherHeader = libraryGrid.querySelector('.results-separator--others');
        
        const shouldShowSeparators = !isPoolView && currentSearchTags.length > 0 && allSelectedImageIds.length > 0;
        
        if (!shouldShowSeparators) {
            // Remove separators if they shouldn't be shown
            if (existingMatchedHeader) existingMatchedHeader.remove();
            if (existingOtherHeader) existingOtherHeader.remove();
            return;
        }
        
        const selectedImagesData = loadedImages.filter(({ image }) => allSelectedImageIds.includes(image.id));
        
        // Create or update "Matched" separator
        if (!existingMatchedHeader) {
            const matchedHeader = document.createElement('div');
            matchedHeader.className = 'results-separator results-separator--matched';
            matchedHeader.textContent = `Matched (${selectedImagesData.length})`;
            // Insert at the beginning of the grid
            if (libraryGrid.firstChild) {
                libraryGrid.insertBefore(matchedHeader, libraryGrid.firstChild);
            } else {
                libraryGrid.appendChild(matchedHeader);
            }
        } else {
            // Update count if separator exists
            existingMatchedHeader.textContent = `Matched (${selectedImagesData.length})`;
        }
        
        // Create or update "Other Images" separator
        // Find the position: after all matched cards (selected or tag-selection)
        const allCards = Array.from(libraryGrid.querySelectorAll('.library-card'));
        const matchedCards = allCards.filter(card => 
            card.classList.contains('selected') || card.classList.contains('tag-selection')
        );
        
        if (matchedCards.length > 0 && !existingOtherHeader) {
            const otherHeader = document.createElement('div');
            otherHeader.className = 'results-separator results-separator--others';
            otherHeader.textContent = 'Other Images (manual selection allowed)';
            // Insert after the last matched card
            const lastMatchedCard = matchedCards[matchedCards.length - 1];
            lastMatchedCard.insertAdjacentElement('afterend', otherHeader);
        } else if (matchedCards.length === 0 && existingOtherHeader) {
            // Remove other header if there are no matched cards
            existingOtherHeader.remove();
        }
    }

    // Display a page of images (3 rows)
    function displayImagePage(loadedImages, currentSearchTags, loadedPatterns = []) {
        // Check if we should show selected images at front (library view with selections, not pool view, first page only)
        const allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];
        const shouldShowSelectedAtFront = !isPoolView && allSelectedImageIds.length > 0 && currentPage === 0;
        const shouldShowNoMatchFoundHeader = !isPoolView && allSelectedImageIds.length === 0 && currentPage === 0 && currentSearchTags.length > 0;
        // Track if selected images were shown at front (so we can skip them on subsequent pages)
        const selectedImagesWereShownAtFront = !isPoolView && allSelectedImageIds.length > 0 && currentSearchTags.length > 0;
        
        // For pagination, we need to exclude selected images if they were shown at the front
        // This ensures we paginate through non-selected images correctly
        let imagesForPagination = loadedImages;
        if (selectedImagesWereShownAtFront) {
            imagesForPagination = loadedImages.filter(({ image }) => !allSelectedImageIds.includes(image.id));
        }
        
        const imagesToShow = imagesPerRow * ROWS_PER_PAGE;
        // When selected images are shown at front on page 0, we still show the first page of non-selected images
        // So pagination should work normally - page 0 shows first N non-selected, page 1 shows next N, etc.
        const startIndex = currentPage * imagesToShow;
        const endIndex = startIndex + imagesToShow;
        const pageImages = imagesForPagination.slice(startIndex, endIndex);
        
        // Clear any existing messages
        const existingMessage = libraryGrid.querySelector('.no-images-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Track if any cards were added
        let cardsAdded = 0;

        // When nothing is selected, show a highly visible message at the SAME location as the "Matched (N)" header.
        // requested: <div class="results-separator results-separator--matched">No Match Found</div>
        if (shouldShowNoMatchFoundHeader) {
            const noMatchHeader = document.createElement('div');
            noMatchHeader.className = 'results-separator results-separator--matched';
            noMatchHeader.textContent = 'No Match Found';
            libraryGrid.appendChild(noMatchHeader);
        }
        
        // Ensure separators exist even when loading more pages
        if (currentPage > 0 && !isPoolView && currentSearchTags.length > 0 && allSelectedImageIds.length > 0) {
            ensureSeparatorsExist(loadedImages, currentSearchTags, allSelectedImageIds);
        }
        
        if (shouldShowSelectedAtFront) {
            // First, display selected images at the front (in color, clickable)
            // Get selected images and sort them by chip order priority (first chip tag first)
            let selectedImagesData = loadedImages.filter(({ image }) => allSelectedImageIds.includes(image.id));

            // Add a visual separator so users understand why "other" images appear behind matches.
            // Only show in library view when search tags are active (not pool view).
            const shouldShowMatchedHeader = !isPoolView && currentSearchTags.length > 0;
            if (shouldShowMatchedHeader) {
                const matchedHeader = document.createElement('div');
                matchedHeader.className = 'results-separator results-separator--matched';
                matchedHeader.textContent = `Matched (${selectedImagesData.length})`;
                libraryGrid.appendChild(matchedHeader);
            }
            
            // Sort by chip order if we have search tags
            if (currentSearchTags.length > 0) {
                const chipContainer = document.getElementById('library-search-chips');
                let chipTagsInOrder = [];
                if (chipContainer) {
                    chipTagsInOrder = Array.from(chipContainer.querySelectorAll('.search-chip'))
                        .map(chip => (chip.dataset.tag || '').toLowerCase())
                        .filter(tag => tag);
                }
                
                if (chipTagsInOrder.length > 0) {
                    // Helper: does image match a search tag (respecting exact/partial)
                    const imageMatchesTag = (imgTags, searchTag) => {
                        const searchLower = searchTag.toLowerCase();
                        if (!searchLower) return false;
                        return imgTags.some(imageTag => {
                            const tagLower = imageTag.toLowerCase();
                            return exactWordMode ? (tagLower === searchLower) : tagLower.includes(searchLower);
                        });
                    };
                    
                    // Create priority buckets for each chip tag
                    const priorityBuckets = [];
                    chipTagsInOrder.forEach(tag => priorityBuckets.push({ tag, images: [] }));
                    const remainingSelected = [];
                    
                    selectedImagesData.forEach((item) => {
                        const { image } = item;
                        const imgTags = (image.tags || []).map(t => t.toLowerCase());
                        let placed = false;
                        for (let i = 0; i < chipTagsInOrder.length; i++) {
                            if (imageMatchesTag(imgTags, chipTagsInOrder[i])) {
                                priorityBuckets[i].images.push(item);
                                placed = true;
                                break;
                            }
                        }
                        if (!placed) {
                            remainingSelected.push(item);
                        }
                    });
                    
                    // Sort each bucket by ID desc, then flatten in chip order
                    priorityBuckets.forEach(bucket => bucket.images.sort((a, b) => b.image.id - a.image.id));
                    remainingSelected.sort((a, b) => b.image.id - a.image.id);
                    
                    selectedImagesData = [
                        ...priorityBuckets.flatMap(b => b.images),
                        ...remainingSelected
                    ];
                }
            }
            
            selectedImagesData.forEach(({ image, index, imageSrc }) => {
                const card = createImageCard(image, index, imageSrc, currentSearchTags, false);
                libraryGrid.appendChild(card);
                cardsAdded++;
            });

            // After rendering the matched block, disable search-chip highlighting for the rest of the library.
            // "Other Images" should appear neutral (no outline), even if their tags contain the search terms.
            chipsReferenceOnly = true;
        }

        // If we displayed matched images at the front, insert an "Other Images" header before the rest.
        // Also ensure it exists when loading more pages if separators should be shown
        const shouldShowOtherHeader = selectedImagesWereShownAtFront && !isPoolView && currentSearchTags.length > 0;
        if (shouldShowOtherHeader) {
            // Check if it already exists
            const existingOtherHeader = libraryGrid.querySelector('.results-separator--others');
            if (!existingOtherHeader) {
                const otherHeader = document.createElement('div');
                otherHeader.className = 'results-separator results-separator--others';
                otherHeader.textContent = 'Other Images (manual selection allowed)';
                // Find where to insert it - after matched images or after matched header
                const matchedHeader = libraryGrid.querySelector('.results-separator--matched');
                const matchedCards = Array.from(libraryGrid.querySelectorAll('.library-card.selected, .library-card.tag-selection'));
                if (matchedCards.length > 0) {
                    // Insert after last matched card
                    matchedCards[matchedCards.length - 1].insertAdjacentElement('afterend', otherHeader);
                } else if (matchedHeader) {
                    // Insert after matched header if no matched cards yet
                    matchedHeader.insertAdjacentElement('afterend', otherHeader);
                } else {
                    libraryGrid.appendChild(otherHeader);
                }
            }
        }

        // Debug logging for Load More - always log when page > 0
        if (currentPage > 0) {
            console.log('[Load More Debug - Page ' + currentPage + ']', {
                currentPage,
                totalLoadedImages: loadedImages.length,
                selectedCount: allSelectedImageIds.length,
                selectedImageIds: allSelectedImageIds,
                selectedImagesWereShownAtFront,
                filteredImagesCount: imagesForPagination.length,
                pageImagesCount: pageImages.length,
                startIndex,
                endIndex,
                imagesToShow,
                firstFewImageIds: pageImages.slice(0, 3).map(item => item?.image?.id),
                isPoolView,
                currentSearchTagsLength: currentSearchTags.length
            });
        }
        
        // Log if pageImages is empty when it shouldn't be
        if (pageImages.length === 0 && currentPage > 0) {
            console.warn('[Load More Warning] pageImages is empty', {
                currentPage,
                imagesForPaginationLength: imagesForPagination.length,
                startIndex,
                endIndex,
                imagesToShow,
                shouldHaveImages: imagesForPagination.length > startIndex,
                selectedImagesWereShownAtFront,
                allSelectedImageIdsLength: allSelectedImageIds.length
            });
        }
        
        pageImages.forEach(({ image, index, imageSrc }) => {
            const card = createImageCard(image, index, imageSrc, currentSearchTags, false);
            libraryGrid.appendChild(card);
            cardsAdded++;
        });

        // Don't display patterns in search results (user requirement)

        // Show message if no images were added to the grid (and not in pool view, which has its own message)
        // This covers cases like: no images loaded, OR mode with no matches, etc.
        if (!isPoolView && cardsAdded === 0 && currentPage === 0) {
            // Requested: use the same visible separator style to make "no result" easy to notice.
            // <div class="results-separator results-separator--matched">No Match Found</div>
            const noMatchHeader = document.createElement('div');
            noMatchHeader.className = 'results-separator results-separator--matched';
            noMatchHeader.textContent = 'No Match Found';
            libraryGrid.appendChild(noMatchHeader);

            // Keep the existing message as secondary/explanatory text (optional).
            const noImagesMessage = document.createElement('div');
            noImagesMessage.className = 'no-images-message';
            noImagesMessage.style.textAlign = 'center';
            noImagesMessage.style.padding = '20px 40px 40px';
            noImagesMessage.style.color = '#666';
            noImagesMessage.innerHTML = '<p>No images to display.</p>';
            libraryGrid.appendChild(noImagesMessage);
        }
        
        // Auto-fit when there's only one image - disable scrolling and scroll to top
        setTimeout(() => {
            const cards = libraryGrid.querySelectorAll('.library-card');
            if (cards.length === 1) {
                // Scroll the grid container to the top
                libraryGrid.scrollTop = 0;
                // Add class to disable scrolling
                libraryGrid.classList.add('single-image');
            } else {
                // Remove class to re-enable scrolling
                libraryGrid.classList.remove('single-image');
            }
        }, 100);

        // Calculate displayed count for button
        let displayedCount = startIndex + pageImages.length;
        if (shouldShowSelectedAtFront) {
            // Add selected images count to displayed count
            displayedCount += allSelectedImageIds.length;
        }

        // Add or update "Load More" button
        updateLoadMoreButton(loadedImages.length, displayedCount);
    }

    // Update or add "Load More" and "Load All" buttons
    function updateLoadMoreButton(totalImages, displayedCount) {
        // Remove existing buttons if any
        const existingLoadMoreBtn = document.getElementById('load-more-btn');
        const existingLoadAllBtn = document.getElementById('load-all-btn');
        if (existingLoadMoreBtn) {
            existingLoadMoreBtn.remove();
        }
        if (existingLoadAllBtn) {
            existingLoadAllBtn.remove();
        }

        // Only show buttons if there are more images to load
        if (displayedCount < totalImages) {
            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'load-buttons-container';
            
            // Load More button
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'load-more-btn';
            loadMoreBtn.className = 'load-more-button';
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.addEventListener('click', () => {
                loadMoreImages();
            });
            buttonContainer.appendChild(loadMoreBtn);
            
            // Load All button
            const loadAllBtn = document.createElement('button');
            loadAllBtn.id = 'load-all-btn';
            loadAllBtn.className = 'load-all-button';
            loadAllBtn.textContent = 'Load All (but it takes time)';
            loadAllBtn.addEventListener('click', () => {
                loadAllImages();
            });
            buttonContainer.appendChild(loadAllBtn);
            
            libraryGrid.appendChild(buttonContainer);
        }
    }

    // Load more images (3 more rows)
    function loadMoreImages() {
        console.log('[loadMoreImages] Called, currentPage before increment:', currentPage);
        currentPage++;
        console.log('[loadMoreImages] currentPage after increment:', currentPage);
        // Recalculate images per row in case window was resized
        calculateImagesPerRow();
        
        const loadedImages = libraryImages
            .map((libImg, idx) => {
                const originalImage = allImagesToDisplay.find(img => img.id === libImg.id);
                if (!originalImage || !libImg.loaded) return null;
                return {
                    image: originalImage,
                    index: idx,
                    imageSrc: libImg.src
                };
            })
            .filter(item => item !== null);

        const currentSearchTags = searchTags.map(tag => tag.text);
        // Get patterns from searchPatterns if available
        const loadedPatterns = searchPatterns.length > 0 ? searchPatterns.map((pattern, idx) => ({
            pattern,
            index: idx,
            patternSrc: `${API_URL}/${pattern.filepath.replace(/\\/g, '/')}`,
            loaded: true,
            type: 'pattern'
        })) : [];
        displayImagePage(loadedImages, currentSearchTags, loadedPatterns);
    }

    // Load all remaining images
    function loadAllImages() {
        // Recalculate images per row in case window was resized
        calculateImagesPerRow();
        
        const loadedImages = libraryImages
            .map((libImg, idx) => {
                const originalImage = allImagesToDisplay.find(img => img.id === libImg.id);
                if (!originalImage || !libImg.loaded) return null;
                return {
                    image: originalImage,
                    index: idx,
                    imageSrc: libImg.src
                };
            })
            .filter(item => item !== null);

        const currentSearchTags = searchTags.map(tag => tag.text);
        const allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];
        const shouldShowSeparators = !isPoolView && currentSearchTags.length > 0 && allSelectedImageIds.length > 0;
        
        // Separate matched images from other images
        const matchedImages = [];
        const otherImages = [];
        
        loadedImages.forEach((item) => {
            if (allSelectedImageIds.includes(item.image.id)) {
                matchedImages.push(item);
            } else {
                otherImages.push(item);
            }
        });
        
        // Clear grid and display all images
        libraryGrid.innerHTML = '';
        
        // Add "Matched" separator if needed
        if (shouldShowSeparators && matchedImages.length > 0) {
            const matchedHeader = document.createElement('div');
            matchedHeader.className = 'results-separator results-separator--matched';
            matchedHeader.textContent = `Matched (${matchedImages.length})`;
            libraryGrid.appendChild(matchedHeader);
        }
        
        // Display matched images first
        matchedImages.forEach(({ image, index, imageSrc }) => {
            const card = createImageCard(image, index, imageSrc, currentSearchTags, false);
            libraryGrid.appendChild(card);
        });
        
        // Add "Other Images" separator if needed
        if (shouldShowSeparators && matchedImages.length > 0 && otherImages.length > 0) {
            const otherHeader = document.createElement('div');
            otherHeader.className = 'results-separator results-separator--others';
            otherHeader.textContent = 'Other Images (manual selection allowed)';
            libraryGrid.appendChild(otherHeader);
        }
        
        // Display other images
        otherImages.forEach(({ image, index, imageSrc }) => {
            const card = createImageCard(image, index, imageSrc, currentSearchTags, false);
            libraryGrid.appendChild(card);
        });
        
        // Update currentPage to reflect that all images are displayed
        const imagesToShow = imagesPerRow * ROWS_PER_PAGE;
        currentPage = Math.ceil(loadedImages.length / imagesToShow) - 1;
        
        // Remove buttons since all images are now loaded
        updateLoadMoreButton(loadedImages.length, loadedImages.length);
    }
    
    // Recalculate images per row on window resize
    window.addEventListener('resize', () => {
        if (allImagesToDisplay.length > 0) {
            calculateImagesPerRow();
        }
    });

    async function displayLibraryImages() {
        chipsReferenceOnly = false; // Reset at start of every render so highlight logic is fresh
        console.log('=== displayLibraryImages START ===');
        console.log('displayLibraryImages called, selectedImages at start:', selectedImages.length);
        console.log('isPoolView at start:', isPoolView);

        const searchMode = tagSearchMode; // Use current tag search mode (OR or AND)
        const currentSearchTags = getActiveSearchTagTexts();
        console.log('currentSearchTags:', currentSearchTags);
        console.log('searchMode:', searchMode);

        // Defensive: in AND mode with active tags, do not allow any stale non-manual selections
        // (e.g., previously tag-merged selections) to remain in selectedImages.
        if (searchMode === 'AND' && currentSearchTags.length > 0) {
            const previous = selectedImages.slice();
            const kept = previous.filter(id => imageSelectionSource[id] === 'manual');
            const removed = previous.filter(id => imageSelectionSource[id] !== 'manual');
            if (removed.length > 0) {
                selectedImages = kept;
                removed.forEach(id => {
                    delete imageSelectionOrder[id];
                    delete imageSelectionSource[id];
                });
                console.log('[AND mode] Removed stale non-manual selections:', removed);
            }
        }

        try {
            // Clear broken image tracking for new load
            clearBrokenImageTracking();

            // Get all images first
            // Use API helpers (modules/api.js)
            const allImagesResponse = await window.apiFetch('/images');
            const allImagesData = await allImagesResponse.json();
            const allImages = Array.isArray(allImagesData) ? allImagesData : allImagesData.images || [];


            let imagesToDisplay = [];

            if (isPoolView && currentSearchTags.length === 0) {
                console.log('=== POOL VIEW LOGIC (NO SEARCH TAGS) ===');
                console.log('selectedImages:', selectedImages);
                console.log('tagSelectedImages:', tagSelectedImages);
                // Pool view without search tags - show ALL selected images (both manual and tag-selected)
                const allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];
                console.log('allSelectedImageIds combined:', allSelectedImageIds);
                imagesToDisplay = allImages.filter(img => allSelectedImageIds.includes(img.id));
                console.log('Pool view filtered images:', imagesToDisplay.length, '(manual + tag selected)');

                console.log('Pool view without search tags - showing all selected images by selection order');
                // Sort by selection order (most recently selected first)
                imagesToDisplay.sort((a, b) => {
                    const orderA = imageSelectionOrder[a.id] || 0;
                    const orderB = imageSelectionOrder[b.id] || 0;
                    return orderB - orderA; // Latest selection first
                });

                console.log('Pool view processing completed');
            } else if (isPoolView && currentSearchTags.length > 0) {
                console.log('=== POOL VIEW LOGIC (WITH SEARCH TAGS) ===');
                console.log('Processing tags first, then combining with existing selections');

                // Sync exactWordMode with button state before searching
                if (exactWordToggleBtn) {
                    const buttonIsActive = exactWordToggleBtn.classList.contains('is-active');
                    if (exactWordMode !== buttonIsActive) {
                        console.warn('[FRONTEND] exactWordMode variable out of sync with button! Variable:', exactWordMode, 'Button:', buttonIsActive, '- syncing...');
                        exactWordMode = buttonIsActive;
                    }
                }

                // Sync patternMode with button state before searching
                if (patternToggleBtn) {
                    const patternButtonIsActive = patternToggleBtn.classList.contains('is-active');
                    if (patternMode !== patternButtonIsActive) {
                        console.warn('[FRONTEND POOL] patternMode variable out of sync with button! Variable:', patternMode, 'Button:', patternButtonIsActive, '- syncing...');
                        patternMode = patternButtonIsActive;
                    }
                }

                // First, process the search tags to get tag-matching images
                console.log('Fetching tag-matching images for tags:', currentSearchTags);
                const matchMode = exactWordMode ? 'exact' : 'partial';
                const patternParam = patternMode ? '&pattern=1' : '';
                console.log('[FRONTEND POOL] Searching with tags:', currentSearchTags, 'mode:', searchMode, 'matchMode:', matchMode, 'exactWordMode:', exactWordMode, 'patternMode:', patternMode);
                const tagResponse = await window.apiFetch(`/images?tags=${currentSearchTags.join(',')}&mode=${searchMode}&match=${matchMode}${patternParam}`);

                if (!tagResponse.ok) {
                    throw new Error(`Tag search failed: ${tagResponse.status} ${tagResponse.statusText}`);
                }

                const tagResponseData = await tagResponse.json();
                // Handle both array response and object with debug info
                const tagMatchingImages = Array.isArray(tagResponseData) ? tagResponseData : tagResponseData.images || [];
                
                // Show debug info in browser console if available
                if (tagResponseData.debug) {
                    console.log('[BROWSER DEBUG] Pattern mode:', tagResponseData.debug.patternMode);
                    console.log('[BROWSER DEBUG] Search tags:', tagResponseData.debug.searchTags);
                    console.log('[BROWSER DEBUG] Total images:', tagResponseData.debug.totalImages);
                    console.log('[BROWSER DEBUG] Image 207 in results:', tagResponseData.debug.image207InResults);
                    if (tagResponseData.debug.image207Info) {
                        console.log('[BROWSER DEBUG] Image 207 info:', tagResponseData.debug.image207Info);
                        console.log('[BROWSER DEBUG] Image 207 should be removed:', tagResponseData.debug.image207Info.shouldBeRemoved);
                    }
                }
                
                console.log('Tag-matching images found:', tagMatchingImages.length);

                // Update tag-selected images (add new ones, keep existing ones)
                const newTagSelectedImages = tagMatchingImages.map(img => img.id);
                console.log('newTagSelectedImages from tags:', newTagSelectedImages);
                console.log('selectedImages before tag processing:', selectedImages);
                console.log('tagSelectedImages before tag processing:', tagSelectedImages);
                const currentTimestamp = Date.now();

                // Track how each image was selected
                const searchTagsString = currentSearchTags.join(',');
                tagMatchingImages.forEach(image => {
                    if (!imageSelectionSource[image.id]) {
                        imageSelectionSource[image.id] = searchTagsString;
                    }
                });

                // Track selection timestamps for new tag-selected images
                newTagSelectedImages.forEach(imageId => {
                    if (!tagSelectedImages.includes(imageId)) {
                        imageSelectionOrder[imageId] = currentTimestamp;
                    }
                });

                // When mode changes, replace tagSelectedImages with new results (don't merge)
                // This ensures AND mode shows only images matching ALL tags, OR mode shows images matching ANY tag
                tagSelectedImages = newTagSelectedImages;

                // DON'T add tag images to selectedImages - keep them separate
                // selectedImages = manual selections only
                // tagSelectedImages = tag selections only
                // Combine them only for display purposes

                console.log('selectedImages after tag processing:', selectedImages);
                console.log('tagSelectedImages after tag processing (mode:', searchMode, '):', tagSelectedImages);

                // Now combine selections for pool view display, respecting AND/OR mode
                let allSelectedImageIds;
                if (searchMode === 'AND') {
                    // AND mode: Only show images that match ALL tags (use newTagSelectedImages from current API call)
                    // Include manually selected images only if they also match ALL tags
                    const currentTagsLower = currentSearchTags.map(t => t.toLowerCase());
                    const manuallySelectedMatchingAll = selectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        if (!img) return false;
                        const imageTags = (img.tags || []).map(t => t.toLowerCase());
                        return currentTagsLower.every(searchTag => {
                            return imageTags.some(imageTag => {
                                return exactWordMode ? (imageTag === searchTag) : imageTag.includes(searchTag);
                            });
                        });
                    });
                    // Use newTagSelectedImages (current API result) instead of tagSelectedImages (which may contain old OR-mode selections)
                    allSelectedImageIds = [...new Set([...manuallySelectedMatchingAll, ...newTagSelectedImages])];
                    console.log('AND mode - newTagSelectedImages:', newTagSelectedImages, 'manuallySelectedMatchingAll:', manuallySelectedMatchingAll);
                } else {
                    // OR mode: Show all selected images (manual + tag-selected)
                    allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];
                }
                console.log('allSelectedImageIds combined for pool view (mode:', searchMode, '):', allSelectedImageIds);
                
                // If no images are selected, show empty grid with "No images to display." message
                if (allSelectedImageIds.length === 0) {
                    imagesToDisplay = [];
                } else {
                    imagesToDisplay = allImages.filter(img => allSelectedImageIds.includes(img.id));
                }

                // Group by tags since we have search tags active
                imagesToDisplay = groupImagesByTagsAndSort(imagesToDisplay);

                console.log('Pool view with tags processing completed, final images:', imagesToDisplay.length);
            } else if (currentSearchTags.length === 0) {
                console.log('=== LIBRARY VIEW WITH NO TAGS ===');
                // Library view with no search tags - show all images, latest first
                // DON'T clear tagSelectedImages here - preserve historical tag selections
                imagesToDisplay = allImages;

                // Sort by image ID in descending order (latest uploads first)
                imagesToDisplay.sort((a, b) => b.id - a.id);

                // Clear patterns when no search tags
                searchPatterns = [];

                console.log('Library view with no active tags, sorted latest first, preserving tagSelectedImages:', tagSelectedImages.length);
            } else {
                // Library view with search tags (NOT pool view):
                // Show matching images first, then all other images (allow browsing non-matching)
                console.log('=== LIBRARY VIEW WITH SEARCH TAGS (BACKEND FILTER) ===');

                // Sync exactWordMode with button state before searching
                if (exactWordToggleBtn) {
                    const buttonIsActive = exactWordToggleBtn.classList.contains('is-active');
                    if (exactWordMode !== buttonIsActive) {
                        console.warn('[FRONTEND] exactWordMode variable out of sync with button! Variable:', exactWordMode, 'Button:', buttonIsActive, '- syncing...');
                        exactWordMode = buttonIsActive;
                    }
                }

                const sessionToken2 = localStorage.getItem('sessionToken');
                const headers2 = {};
                if (sessionToken2) {
                    headers2['Authorization'] = `Bearer ${sessionToken2}`;
                }

                // exactWordMode:
                //   true  -> match=exact   (full word)
                //   false -> match=partial (substring, e.g. "ost" matches "ghost spider")
                const matchMode = exactWordMode ? 'exact' : 'partial';
                const patternParam = patternMode ? '&pattern=1' : '';

                console.log('[FRONTEND] Searching with tags:', currentSearchTags, 'mode:', searchMode, 'matchMode:', matchMode, 'exactWordMode:', exactWordMode, 'patternMode:', patternMode);
                console.log('[FRONTEND] Button state check - has is-active:', exactWordToggleBtn ? exactWordToggleBtn.classList.contains('is-active') : 'button not found');
                console.log('[FRONTEND] Using matchMode:', matchMode, 'for search');

                // When patternMode is ON, the backend expects plain search terms like "twill,ca"
                // and will search ONLY pattern:* tags.
                // So we must NOT prefix them with "pattern:" here.
                const patternSearchTags = currentSearchTags.map(tag => {
                    const tagStr = String(tag).trim();
                    const lower = tagStr.toLowerCase();
                    if (lower.startsWith('pattern:')) {
                        const idx = tagStr.indexOf(':');
                        return idx >= 0 ? tagStr.slice(idx + 1).trim() : tagStr;
                    }
                    return tagStr;
                }).filter(Boolean);

                const apiUrl = `${API_URL}/images?tags=${encodeURIComponent(patternSearchTags.join(','))}&mode=${searchMode}&match=${matchMode}${patternParam}`;
                const patternApiUrl = `${API_URL}/api/patterns/search?tags=${encodeURIComponent(patternSearchTags.join(','))}&mode=${searchMode}&match=${matchMode}`;
                console.log('[FRONTEND] API URL:', apiUrl);
                console.log('[FRONTEND] Pattern API URL:', patternApiUrl);
                console.log('[FRONTEND] Request parameters - tags:', currentSearchTags, 'mode:', searchMode, 'match:', matchMode);
                
                // Fetch both images and patterns in parallel
                const [tagResponse, patternResponse] = await Promise.all([
                    fetch(apiUrl, { headers: headers2 }),
                    fetch(patternApiUrl, { headers: headers2 })
                ]);

                if (!tagResponse.ok) {
                    throw new Error(`Tag search failed: ${tagResponse.status} ${tagResponse.statusText}`);
                }

                const tagResponseData2 = await tagResponse.json();
                const tagMatchingImages = Array.isArray(tagResponseData2) ? tagResponseData2 : tagResponseData2.images || [];
                
                // Show debug info in browser if available
                if (tagResponseData2.debug) {
                    console.log('[BROWSER DEBUG] Pattern mode:', tagResponseData2.debug.patternMode);
                    console.log('[BROWSER DEBUG] Image 207 in results:', tagResponseData2.debug.image207InResults);
                    if (tagResponseData2.debug.image207Info) {
                        console.log('[BROWSER DEBUG] Image 207 should be removed:', tagResponseData2.debug.image207Info.shouldBeRemoved);
                    }
                }
                let tagMatchingPatterns = [];
                
                if (patternResponse.ok) {
                    tagMatchingPatterns = await patternResponse.json();
                    console.log('[FRONTEND] Tag-matching patterns from backend found:', tagMatchingPatterns.length);
                    // Store patterns for display
                    searchPatterns = tagMatchingPatterns;
                } else {
                    console.warn('[FRONTEND] Pattern search failed:', patternResponse.status, patternResponse.statusText);
                    searchPatterns = [];
                }
                
                console.log('[FRONTEND] Tag-matching images from backend (subjective only) found:', tagMatchingImages.length);
                console.log('[FRONTEND] Backend returned image IDs:', tagMatchingImages.map(img => img.id));
                console.log('[FRONTEND] Backend returned image tags:', tagMatchingImages.map(img => ({ id: img.id, tags: img.tags })));
                console.log('[FRONTEND] Match mode used:', matchMode, 'exactWordMode was:', exactWordMode);

                // Keep tagSelectedImages in sync with current search mode/results (AND/OR)
                tagSelectedImages = tagMatchingImages.map(img => img.id);

                // Ensure selection metadata is populated for ALL tag-selected images
                // (drives correct red borders + selection count)
                const currentTimestamp = Date.now();
                const searchTagsString = currentSearchTags.join(',');
                tagSelectedImages.forEach(imageId => {
                    if (!imageSelectionOrder[imageId]) {
                        imageSelectionOrder[imageId] = currentTimestamp;
                    }
                    if (!imageSelectionSource[imageId]) {
                        imageSelectionSource[imageId] = searchTagsString;
                    }
                });

                // Group matching images by chip order (left -> right) so newest input tag appears first
                const chipContainer = document.getElementById('library-search-chips');
                let chipTagsInOrder = [];
                if (chipContainer) {
                    chipTagsInOrder = Array.from(chipContainer.querySelectorAll('.search-chip'))
                        .map(chip => (chip.dataset.tag || '').toLowerCase())
                        .filter(tag => tag);
                }

                // Helper: does image match a search tag (respecting exact/partial)
                const imageMatchesTag = (imgTags, searchTag) => {
                    const searchLower = searchTag.toLowerCase();
                    if (!searchLower) return false;
                    return imgTags.some(imageTag => {
                        const tagLower = imageTag.toLowerCase();
                        return exactWordMode ? (tagLower === searchLower) : tagLower.includes(searchLower);
                    });
                };

                // Split matching images by chip order priority
                const priorityBuckets = [];
                chipTagsInOrder.forEach(tag => priorityBuckets.push({ tag, images: [] }));
                const remainingMatches = [];

                tagMatchingImages.forEach(img => {
                    const imgTags = img.tags || [];
                    let placed = false;
                    for (let i = 0; i < chipTagsInOrder.length; i++) {
                        if (imageMatchesTag(imgTags, chipTagsInOrder[i])) {
                            priorityBuckets[i].images.push(img);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) remainingMatches.push(img);
                });

                // Sort each bucket by ID desc
                priorityBuckets.forEach(bucket => bucket.images.sort((a, b) => b.id - a.id));
                remainingMatches.sort((a, b) => b.id - a.id);

                // Flatten buckets in chip order, then remaining matches
                const orderedMatches = [
                    ...priorityBuckets.flatMap(b => b.images),
                    ...remainingMatches
                ];

                // AND & OR: always show matching images first, then all non-matching images.
                // Difference between AND/OR is only which images backend returns as "matching".
                // IMPORTANT: Even when patternMode is ON, we still append non-matching images behind matching ones.
                const matchingIds = new Set(tagMatchingImages.map(img => img.id));

                // Keep tagSelectedImages representing ONLY the backend-matching set.
                // (Non-matching images should not appear selected by search.)
                tagSelectedImages = tagMatchingImages.map(img => img.id);

                // Ensure selection metadata is populated for ALL tag-selected images (same as above)
                // This block may look redundant, but the code intentionally reassigns tagSelectedImages after sorting.
                const currentTimestamp2 = Date.now();
                const searchTagsString2 = currentSearchTags.join(',');
                tagSelectedImages.forEach(imageId => {
                    if (!imageSelectionOrder[imageId]) {
                        imageSelectionOrder[imageId] = currentTimestamp2;
                    }
                    if (!imageSelectionSource[imageId]) {
                        imageSelectionSource[imageId] = searchTagsString2;
                    }
                });

                const nonMatchingImages = allImages
                    .filter(img => !matchingIds.has(img.id))
                    .sort((a, b) => b.id - a.id);

                imagesToDisplay = [...orderedMatches, ...nonMatchingImages];

                if (patternMode) {
                    console.log('Library view with search tags - PATTERN mode: matching first, then non-matching. Matching:', orderedMatches.length, 'Non-matching:', nonMatchingImages.length, 'Total:', imagesToDisplay.length);
                } else if (searchMode === 'AND') {
                    console.log('Library view with search tags - AND mode: matching first, then non-matching. Matching:', orderedMatches.length, 'Non-matching:', nonMatchingImages.length, 'Total:', imagesToDisplay.length);
                } else {
                    console.log('Library view with search tags - OR mode: matching first (by chip order), then non-matching. Matching:', orderedMatches.length, 'Non-matching:', nonMatchingImages.length, 'Total:', imagesToDisplay.length);
                }
            }

            // Update header based on view type - check if we're showing selection pool
            console.log('=== TITLE UPDATE LOGIC ===');
            console.log('About to update title - isPoolView:', isPoolView);
            console.log('currentSearchTags.length:', currentSearchTags.length);

            const showingSelectionPool = isShowingSelectionPool();
            console.log('isShowingSelectionPool():', showingSelectionPool);

            if (isPoolView) {
                // Always show Selection Pool title when explicitly in pool view
                console.log('Setting title to Selection Pool (explicit pool view)');
                updateLibraryTitle(true);
            } else if (showingSelectionPool && !forceLibraryView) {
                console.log('Setting title to Selection Pool (showing selection pool)');
                updateLibraryTitle(true); // Selection Pool (active search or pool view)
            } else if (currentSearchTags.length > 0 && forceLibraryView) {
                console.log('STAYING in Library view despite search tags (user requested)');
                console.log('currentSearchTags:', currentSearchTags);
                updateLibraryTitle(false); // Keep library title
                forceLibraryView = false; // Reset flag after use
            } else {
                console.log('Setting title to regular Library');
                updateLibraryTitle(false); // Full library
            }

            // Update search input visibility based on view type
            updateSearchInputVisibility();

            // SAFETY CHECK: Always disable search input/clear button if title shows Selection Pool
            setTimeout(() => {
                const libraryTitle = document.querySelector('#page-library .title');
                if (libraryTitle && libraryTitle.textContent.includes('Selection Pool')) {
                    const searchInput = document.getElementById('library-search-input');
                    const clearAllBtn = document.getElementById('clear-all-tags');

                    searchInput.disabled = true;
                    clearAllBtn.disabled = true;

                    searchInput.style.opacity = '0.5';
                    searchInput.style.cursor = 'not-allowed';
                    clearAllBtn.style.opacity = '0.5';
                    clearAllBtn.style.cursor = 'not-allowed';

                    console.log('SAFETY CHECK: Search controls disabled for Selection Pool');
                }
            }, 100);

            const images = imagesToDisplay;
            
            // Store all images for pagination
            allImagesToDisplay = images;
            currentPage = 0; // Reset pagination when loading new images
            
            // Calculate images per row based on grid width
            calculateImagesPerRow();

            libraryGrid.innerHTML = '';
            libraryImages = []; // Reset library images array
            // Keep existing selected images - don't reset selectedImages array

            // Special handling for pool view with no images
            if (isPoolView && images.length === 0) {
                const noImagesMessage = document.createElement('div');
                noImagesMessage.className = 'no-images-message';
                noImagesMessage.style.textAlign = 'center';
                noImagesMessage.style.padding = '40px';
                noImagesMessage.style.color = '#666';
                noImagesMessage.innerHTML = '<p>No images in selection pool.</p><p>You can use "Back to Library" to return to the main library and select more images.</p>';
                libraryGrid.appendChild(noImagesMessage);
                return; // Exit early if no images
            }
            
            // Show loading skeleton cards
            showLoadingSkeletons();

            // Check which tags have matches and update chip colors
            await updateTagChipColors(currentSearchTags, searchMode);

            // Add tag group headers in Selection Pool view OR when there are search tags active
            if ((isPoolView || currentSearchTags.length > 0) && images.length > 0) {
                addTagGroupHeaders(images);
            }

            // Process images with broken image detection
            const imagePromises = images.map(async (image, index) => {
                const imageSrc = `${API_URL}/${image.filepath.replace(/\\/g, '/')}`;

                // Test if image loads
                return new Promise((resolve) => {
                    const testImg = new Image();
                    testImg.onload = () => resolve({ image, index, imageSrc, loaded: true, type: 'image' });
                    testImg.onerror = () => {
                        trackBrokenImage(image.id, imageSrc);
                        resolve({ image, index, imageSrc, loaded: false, type: 'image' });
                    };
                    testImg.src = imageSrc;
                });
            });

            // Process patterns (only when there are search tags)
            const patternPromises = (currentSearchTags.length > 0 && searchPatterns.length > 0) ? searchPatterns.map(async (pattern, index) => {
                const patternSrc = `${API_URL}/${pattern.filepath.replace(/\\/g, '/')}`;

                // Test if pattern loads
                return new Promise((resolve) => {
                    const testImg = new Image();
                    testImg.onload = () => resolve({ pattern, index, patternSrc, loaded: true, type: 'pattern' });
                    testImg.onerror = () => resolve({ pattern, index, patternSrc, loaded: false, type: 'pattern' });
                    testImg.src = patternSrc;
                });
            }) : [];

            // Wait for all image and pattern load tests to complete
            const allResults = await Promise.all([...imagePromises, ...patternPromises]);

            // Separate images and patterns
            const imageResults = allResults.filter(r => r.type === 'image');
            const patternResults = allResults.filter(r => r.type === 'pattern');

            // Add ALL images to libraryImages (including broken ones) to preserve selections
            imageResults.forEach(({ image, index, imageSrc, loaded }) => {
                libraryImages.push({
                    src: imageSrc,
                    index: index,
                    tags: image.tags || [],
                    id: image.id,
                    loaded: loaded
                });
            });

            // Store all loaded images and patterns for pagination
            const loadedImages = imageResults.filter(result => result.loaded);
            const loadedPatterns = patternResults.filter(result => result.loaded);
            
            // Clear loading skeletons and display first page (with patterns if available)
            libraryGrid.innerHTML = '';
            displayImagePage(loadedImages, currentSearchTags, loadedPatterns);

            // Show selection controls if there are images and search is active OR if we have selections
            // SPECIAL CASE: Always show controls in pool view, even with no images/selections
            if ((images.length > 0 && (currentSearchTags.length > 0 || selectedImages.length > 0)) || isPoolView) {
                selectionControls.classList.remove('is-hidden');
                await updateSelectionState(); // This will call updateButtonVisibility()
            } else {
                selectionControls.classList.add('is-hidden');
                // Only clear selectedImages if we're not in pool view and have no search tags
                if (!isPoolView && currentSearchTags.length === 0) {
                    selectedImages = [];
                }
                updateButtonVisibility(); // Ensure buttons are correct even when no selections
                updateClearButtonState(); // Ensure Clear All button is disabled when no selections
            }

            console.log('displayLibraryImages completed, selectedImages at end:', selectedImages);
            
            // Ensure button text always reflects current mode (defensive check)
            updateTagModeButtonText();
        } catch (error) {
            console.error('Error fetching images:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                isPoolView: isPoolView,
                selectedImages: selectedImages,
                searchTags: searchTags
            });
            
            // Show user-friendly error message with retry button
            libraryGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p style="font-size: 16px; margin-bottom: 8px;">❌ Error loading images</p>
                    <p style="font-size: 14px; color: #999; margin-bottom: 16px;">${error.message || 'Please check your connection and try again.'}</p>
                    <button class="button" onclick="displayLibraryImages()" style="margin-top: 8px;">Retry</button>
                </div>
            `;

            // Reset states to prevent getting stuck
            if (isPoolView) {
                console.log('Resetting pool view state due to error');
                isPoolView = false;
                viewPoolBtn.classList.remove('is-hidden');
                backToLibraryBtn.classList.add('is-hidden');
                selectAllBtn.classList.remove('is-hidden');
                deselectAllBtn.classList.remove('is-hidden');
            }
        }
    }

    async function updateTagChipColors(tags, searchMode) {
        for (const tagText of tags) {
            try {
                const sessionToken = localStorage.getItem('sessionToken');
                const headers = {};
                if (sessionToken) {
                    headers['Authorization'] = `Bearer ${sessionToken}`;
                }

                let hasMatches = false;
                let imageCount = 0;

                if (exactWordMode) {
                    // Exact mode: ask backend for exact tag matches (subjective tags only)
                    const response = await fetch(`${API_URL}/images?tags=${tagText}&mode=OR&match=exact`, {
                        headers: headers
                    });
                    const images = await response.json();
                    imageCount = images.length;
                    hasMatches = imageCount > 0;
                } else {
                    // Partial mode: fetch all visible images for this user and count via substring match
                    const allImagesResponse = await fetch(`${API_URL}/images`, { headers });
                    const allImages = allImagesResponse.ok ? await allImagesResponse.json() : [];
                    const searchLower = tagText.toLowerCase();
                    const matchingImages = allImages.filter(img =>
                        (img.tags || [])
                            // Only consider subjective/feeling tags (no colon prefix)
                            .filter(t => typeof t === 'string' && !t.includes(':'))
                            .some(t => t.toLowerCase().includes(searchLower))
                    );
                    imageCount = matchingImages.length;
                    hasMatches = imageCount > 0;
                }

                // Update the chip color and count based on matches
                const chip = Array.from(librarySearchChips.querySelectorAll('.search-chip')).find(
                    chip => {
                        // Extract tag name from "tagname (count)" format
                        const chipText = chip.textContent.replace(/[×x]$/, '').trim();
                        const tagName = chipText.replace(/\s*\(\d+\)$/, '');
                        return tagName === tagText;
                    }
                );

                if (chip) {
                    // Update the chip text with new count
                    const deleteBtn = chip.querySelector('.chip-delete');
                    chip.textContent = `${tagText} (${imageCount})`;
                    if (deleteBtn) {
                        chip.appendChild(deleteBtn); // Re-add the delete button
                    }

                    // Update color classes
                    if (hasMatches) {
                        chip.classList.remove('no-matches');
                        chip.classList.add('has-matches');
                    } else {
                        chip.classList.remove('has-matches');
                        chip.classList.add('no-matches');
                    }
                }

                // Update searchTags array
                const tagIndex = searchTags.findIndex(tag => tag.text === tagText);
                if (tagIndex !== -1) {
                    searchTags[tagIndex].hasMatches = hasMatches;
                }
            } catch (error) {
                console.error(`Error checking matches for tag "${tagText}":`, error);
            }
        }
    }

    async function navigateTo(pageName) {
        const confirmModal = document.getElementById('confirm-modal');
        // Do not navigate if the confirmation modal is visible
        if (confirmModal && !confirmModal.classList.contains('is-hidden')) {
            return;
        }
        
        // Level-based access control: Level 1 users can only access library, upload, and project
        if (currentUser) {
            const userLevel = parseInt(currentUser.level, 10) || 1;
            if (userLevel === 1 && (pageName === 'admin' || pageName === 'tags')) {
                alert('Access restricted. Level 1 users can only access Image Library, Upload Image, and Project.');
                return;
            }
        }
        
        Object.values(pages).forEach(page => page.classList.add('is-hidden'));
        document.querySelectorAll('.menu__item').forEach(link => link.classList.remove('is-active'));
        pages[pageName].classList.remove('is-hidden');
        navLinks[pageName].classList.add('is-active');

        if (pageName === 'library') {
            clearBrokenImageTracking();
            initializeFreshSearchInput();
            displayLibraryImages();
        } else if (pageName === 'project') {
            displayProjects();
        } else if (pageName === 'admin') {
            loadAdminUsers();
        } else if (pageName === 'upload') {
            fetchSubjFrequencies();
            // Load patterns into dropdown when upload page is shown
            loadPatternsIntoDropdown();
        } else if (pageName === 'upload-pattern') {
            // Load pattern thumbnails when page is shown
            loadPatternThumbnails();
        } else if (pageName === 'pattern-apply') {
            // Pattern Apply page initialization
            await loadPatternsForPatternApply();
            initializePatternApplyDropzone();
            initializePatternApplyPatternDrop();
        }
    }

    function handleFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            filesToUpload.push(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                const card = document.createElement('div');
                card.className = 'preview-card';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.addEventListener('click', (event) => {
                    const allImages = Array.from(previewGrid.querySelectorAll('img'));
                    const clickedIndex = allImages.indexOf(event.target);
                    openModal(clickedIndex);
                });

                const del = document.createElement('button');
                del.type = 'button';
                del.className = 'delete-btn';
                del.textContent = '×';
                del.addEventListener('click', () => {
                    // Show confirmation modal
                    const confirmModal = document.getElementById('delete-upload-image-confirm-modal');
                    if (confirmModal) {
                        // Generate unique ID for this card if it doesn't have one
                        if (!card.dataset.cardId) {
                            card.dataset.cardId = 'card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                        }
                        
                        // Store references for deletion
                        confirmModal.dataset.cardId = card.dataset.cardId;
                        confirmModal.dataset.fileIndex = filesToUpload.indexOf(file).toString();
                        
                        confirmModal.classList.remove('is-hidden');
                    }
                });

                // Add 1:1 icon and ruler icon for full-size preview
                const previewIcon = document.createElement('div');
                previewIcon.className = 'image-preview-eye';
                previewIcon.textContent = '1:1';
                previewIcon.title = 'Preview full size image';
                const imageSrc = e.target.result; // Store image source for preview
                previewIcon.addEventListener('click', (evt) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    // Show image in overlay at original size
                    showImagePreviewOverlay(imageSrc, null);
                });

                // Ruler icon for real size (only if dimensions are available)
                const objWidth = document.getElementById('obj-width').value;
                const objLength = document.getElementById('obj-length').value;
                const rulerIcon = document.createElement('div');
                rulerIcon.className = 'image-preview-ruler';
                rulerIcon.innerHTML = '📏';
                rulerIcon.title = 'Preview real size (1:1 based on dimensions)';
                
                if (objWidth || objLength) {
                    rulerIcon.addEventListener('click', (evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        // Show image in overlay at real size
                        const tempImage = {
                            width: objWidth || null,
                            length: objLength || null
                        };
                        showRealSizeOverlay(imageSrc, tempImage);
                    });
                } else {
                    rulerIcon.style.opacity = '0.5';
                    rulerIcon.style.cursor = 'not-allowed';
                    rulerIcon.title = 'Add width or length to enable real size preview';
                }

                card.appendChild(del);
                card.appendChild(img);
                card.appendChild(previewIcon);
                card.appendChild(rulerIcon);
                
                // Save scroll position before appending to prevent auto-scroll
                const dropzone = document.getElementById('dropzone');
                const scrollTop = dropzone ? dropzone.scrollTop : 0;
                const scrollLeft = dropzone ? dropzone.scrollLeft : 0;
                
                previewGrid.appendChild(card);
                
                // Restore scroll position to prevent scrolling after image load
                if (dropzone) {
                    dropzone.scrollTop = scrollTop;
                    dropzone.scrollLeft = scrollLeft;
                }
                
                // Check if there's only one image and adjust upload-area scrolling
                setTimeout(() => {
                    const cards = previewGrid.querySelectorAll('.preview-card');
                    const uploadArea = document.getElementById('dropzone');
                    if (cards.length === 1 && uploadArea) {
                        uploadArea.classList.add('single-image');
                    } else if (uploadArea) {
                        uploadArea.classList.remove('single-image');
                    }
                    // Restore scroll position again after timeout to ensure it's maintained
                    if (uploadArea) {
                        uploadArea.scrollTop = scrollTop;
                        uploadArea.scrollLeft = scrollLeft;
                    }
                }, 100);
            };
            reader.readAsDataURL(file);
        }
    }

    function showSubjToast(message) {
        if (!message) return;
        const existing = document.getElementById('subj-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'subj-toast';
        toast.className = 'subj-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        if (subjToastTimeout) clearTimeout(subjToastTimeout);
        subjToastTimeout = setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    function isObjectiveTag(tag) {
        if (!tag) return false;
        const t = String(tag).toLowerCase();
        const prefixes = [
            'book:', 'page:', 'row:', 'column:', 'type:', 'material:', 'width:',
            'length:', 'remark:', 'brand:', 'color:', 'dimension:'
        ];
        return prefixes.some(p => t.startsWith(p));
    }

    function getCurrentFeelingTags() {
        if (!subjChips) return [];
        return Array.from(subjChips.querySelectorAll('.chip')).map(c =>
            c.textContent.replace(/[×x]$/, '').trim().toLowerCase()
        );
    }

    function refreshSubjFreqDisabledState() {
        if (!subjFreqList) return;
        const currentTags = new Set(getCurrentFeelingTags());
        Array.from(subjFreqList.querySelectorAll('.subj-freq-item')).forEach(row => {
            const label = (row.dataset.label || '').toLowerCase();
            const isUsed = currentTags.has(label);
            if (isUsed) {
                row.classList.add('disabled');
            } else {
                row.classList.remove('disabled');
            }
        });
    }

    function updateSubjFreqList() {
        if (!subjFreqList) return;
        // Convert map to array and sort based on current sort mode
        const items = Object.entries(subjFreqMap)
            .map(([label, count]) => ({ label, count }));
        
        if (subjFreqSortMode === 'alphabetical') {
            items.sort((a, b) => a.label.localeCompare(b.label));
        } else {
            // Default: sort by count desc, then label asc
            items.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        }

        subjFreqList.innerHTML = '';
        items.forEach(({ label, count }) => {
            const row = document.createElement('div');
            row.className = 'subj-freq-item';
            row.dataset.label = label;

            const spanLabel = document.createElement('span');
            spanLabel.className = 'subj-freq-item__label';
            spanLabel.textContent = label;

            const spanCount = document.createElement('span');
            spanCount.className = 'subj-freq-item__count';
            spanCount.textContent = `×${count}`;

            row.appendChild(spanLabel);
            row.appendChild(spanCount);

            // Clicking a frequent item adds it again to chips (once per current feelings)
            row.addEventListener('click', () => {
                if (row.classList.contains('disabled')) {
                    showSubjToast('Tag already added');
                    return;
                }
                const added = addSubjChip(label);
                if (added !== false) {
                    refreshSubjFreqDisabledState();
                    // Keep focus on input field after clicking frequently used tag
                    if (subjInput) {
                        subjInput.focus();
                    }
                }
            });

            subjFreqList.appendChild(row);
        });
        refreshSubjFreqDisabledState();
    }

    async function fetchSubjFrequencies() {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${API_URL}/tag-frequencies`, { headers });
            if (!response.ok) {
                throw new Error(`Failed to fetch tag frequencies: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Reset and populate the in-memory map
            Object.keys(subjFreqMap).forEach(k => delete subjFreqMap[k]);
            data.forEach(item => {
                if (!item || !item.name) return;
                const label = String(item.name).toLowerCase();
                const count = Number(item.count) || 0;
                subjFreqMap[label] = count;
            });

            updateSubjFreqList();
        } catch (err) {
            console.error('Error fetching tag frequencies:', err);
        }
    }

    async function persistFeelingsUsage(feelings) {
        const payload = Array.isArray(feelings) ? feelings : [];
        if (payload.length === 0) return;
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            const response = await fetch(`${API_URL}/feelings/usage`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ feelings: payload })
            });
            if (!response.ok) {
                let errorText;
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = `HTTP ${response.status} ${response.statusText}`;
                }
                throw new Error(`Failed to persist feelings: ${response.status} ${response.statusText} - ${errorText}`);
            }
        } catch (err) {
            console.error('Error persisting feelings usage:', err);
            // Don't throw - this is a non-critical operation
            // But log it clearly for debugging
            console.warn('Feelings usage update failed, but continuing with save operation');
        }
    }

    async function persistFeelingsUsageDecrement(feelings) {
        const payload = Array.isArray(feelings) ? feelings : [];
        if (payload.length === 0) return;
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            const response = await fetch(`${API_URL}/feelings/usage/decrement`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ feelings: payload })
            });
            if (!response.ok) {
                throw new Error(`Failed to decrement feelings: ${response.status} ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error decrementing feelings usage:', err);
        }
    }

    function addSubjChip(label) {
        const text = (label || '').toLowerCase().trim();
        if (!text) return false;
        const exists = [...subjChips.querySelectorAll('.chip')].some(
            c => c.textContent.replace(/[×x]$/, '').trim().toLowerCase() === text
        );
        if (exists) {
            showSubjToast('Tag already added');
            return false;
        }
        const chip = document.createElement('span');
        chip.className = 'chip is-subjective';
        chip.textContent = text;
        chip.tabIndex = 0;

        // Hover behavior: temporarily "flash" images that match this tag
        chip.addEventListener('mouseenter', () => {
            const tagLower = text.toLowerCase();
            const cards = document.querySelectorAll('.library-card');
            cards.forEach(card => {
                const imageId = parseInt(card.dataset.imageId, 10);
                const img = libraryImages.find(img => img.id === imageId);
                if (!img || !img.tags) return;
                const hasTag = img.tags.some(t => t.toLowerCase() === tagLower);
                if (hasTag) {
                    // Pass the tag color into the card via CSS variable for the running dotted border
                    const c = searchTagColors && searchTagColors[tagLower] ? searchTagColors[tagLower] : '#000';
                    card.style.setProperty('--tag-flash-color', c);
                    card.classList.add('tag-flash');
                }
            });
        });

        chip.addEventListener('mouseleave', () => {
            const cards = document.querySelectorAll('.library-card.tag-flash');
            cards.forEach(card => card.classList.remove('tag-flash'));
        });
        chip.addEventListener('click', () => chip.classList.toggle('is-selected'));
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'x';
        x.textContent = '×';
        x.addEventListener('click', (ev) => {
            ev.stopPropagation();
            chip.remove();
            refreshSubjFreqDisabledState();
        });
        chip.appendChild(x);
        subjChips.appendChild(chip);
        refreshSubjFreqDisabledState();
        return true;
    }

    function handleSubjCommit() {
        const parts = subjInput.value.split(',').map(p => p.trim()).filter(p => p.length > 0);
        const uniqueParts = [...new Set(parts.map(p => p.toLowerCase()))];
        uniqueParts.forEach(p => addSubjChip(p));
        subjInput.value = '';
    }

    function handleObjCommit(input) {
        const value = input.value.trim();
        if (value) {
            // Get prefix from data attribute or determine from input id
            const prefix = input.getAttribute('data-prefix') || '';
            // Create tag with prefix (e.g., "book:Album-01" or just "Album-01" if no prefix)
            const tagValue = prefix ? `${prefix}${value}` : value;
            addObjChip(tagValue);
            input.value = '';
        }
    }

    function addObjChip(text) {
        if (!text.trim()) return;

        const chip = document.createElement('div');
        chip.className = 'chip chip--objective';
        chip.textContent = text.trim();

        const x = document.createElement('span');
        x.className = 'chip-remove';
        x.textContent = '×';
        x.addEventListener('click', (ev) => { ev.stopPropagation(); chip.remove(); });
        chip.appendChild(x);
        objChips.appendChild(chip);
    }

    async function autoFillMetadata() {
        // Sample data arrays for random selection
        const sampleData = {
            books: ['Album-01', 'Collection-A', 'Stamps-2024', 'Vintage-Set', 'Modern-Series'],
            pages: ['12', '25', '8', '33', '15', '7', '41'],
            rows: ['1', '2', '3', '4', '5'],
            columns: ['1', '2', '3', '4'],
            types: ['stamp', 'coin', 'banknote', 'postcard', 'photo', 'document'],
            materials: ['paper', 'metal', 'plastic', 'fabric', 'wood', 'ceramic'],
            widths: ['25', '15', '40', '30', '20', '50'],
            lengths: ['30', '20', '25', '35', '25', '30'],
            remarks: [
                'excellent condition, rare find',
                'mint condition, first edition',
                'good condition, slight wear',
                'vintage piece, collector item',
                'pristine condition, never used',
                'historical significance, well preserved'
            ],
            brands: ['royal-mail', 'usps', 'canada-post', 'deutsche-post', 'japan-post'],
            colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white']
        };

        // Random selection function
        const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // Fill all fields with random sample data (without prefixes in input values)
        if (objBookInput) objBookInput.value = random(sampleData.books);
        if (objPageInput) objPageInput.value = random(sampleData.pages);
        if (objRowInput) objRowInput.value = random(sampleData.rows);
        if (objColumnInput) objColumnInput.value = random(sampleData.columns);
        if (objTypeInput) objTypeInput.value = random(sampleData.types);
        if (objMaterialInput) objMaterialInput.value = random(sampleData.materials);
        if (objWidthInput) objWidthInput.value = random(sampleData.widths);
        if (objLengthInput) objLengthInput.value = random(sampleData.lengths);
        if (objRemarkInput) objRemarkInput.value = random(sampleData.remarks);
        if (objBrandInput) objBrandInput.value = random(sampleData.brands);
        if (objColorInput) objColorInput.value = random(sampleData.colors);

        // Randomly select a pattern from available patterns
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${API_URL}/api/patterns`, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const patterns = await response.json();
                if (patterns && patterns.length > 0) {
                    // Randomly select a pattern
                    const randomPattern = random(patterns);
                    selectPattern(
                        randomPattern.id,
                        randomPattern.name || 'Unnamed Pattern',
                        randomPattern.filepath
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching patterns for auto-fill:', error);
            // Continue even if pattern selection fails
        }

        // Visual feedback
        autoFillBtn.textContent = 'Filled!';
        autoFillBtn.style.background = '#4caf50';
        setTimeout(() => {
            autoFillBtn.textContent = 'Auto Fill';
            autoFillBtn.style.background = '#2196f3';
        }, 1500);
    }

    function updateArrowVisibility() {
        const totalImages = imageSources.length;
        prevButton.style.display = (currentImageIndex > 0 && totalImages > 1) ? 'block' : 'none';
        nextButton.style.display = (currentImageIndex < totalImages - 1 && totalImages > 1) ? 'block' : 'none';
    }

    function openModal(index) {
        currentImageIndex = index;
        imageSources = Array.from(previewGrid.querySelectorAll('img')).map(img => img.src);
        modalImg.src = imageSources[currentImageIndex];
        
        // Clear tags for uploaded images (they don't have tags yet)
        if (lightboxTags) lightboxTags.innerHTML = '';
        const freqFloating = document.getElementById('lightbox-freq-floating');
        if (freqFloating) freqFloating.remove();
        if (lightboxLockBtn) lightboxLockBtn.classList.add('is-hidden');
        if (lightboxSaveBtn) lightboxSaveBtn.classList.add('is-hidden');
        pendingAddTags.clear();
        pendingRemoveTags.clear();
        pendingPatternChange = null;
        lightboxDirty = false;
        
        modal.classList.remove('is-hidden');
        updateArrowVisibility();
    }

    function showImage(index) {
        if (index >= imageSources.length || index < 0) return;
        currentImageIndex = index;
        modalImg.src = imageSources[currentImageIndex];
        updateArrowVisibility();
    }

    function hideModal() {
        modal.classList.add('is-hidden');
        const freqFloating = document.getElementById('lightbox-freq-floating');
        if (freqFloating) freqFloating.remove();
        pendingAddTags.clear();
        pendingRemoveTags.clear();
        pendingPatternChange = null;
        lightboxDirty = false;
        isProjectViewLightbox = false; // Reset project view flag
        if (lightboxLockBtn) lightboxLockBtn.classList.add('is-hidden');
        if (lightboxSaveBtn) lightboxSaveBtn.classList.add('is-hidden');
    }

    // --- Library Lightbox Functions ---

    function displayLightboxMetadata(index) {
        const metadataPanel = document.getElementById('lightbox-metadata-panel');
        if (!metadataPanel || index >= currentLightboxImages.length || index < 0) return;

        const image = currentLightboxImages[index];
        const tags = image.tags || [];

        // Extract metadata from tags
        const metadata = {
            book: '',
            page: '',
            row: '',
            column: '',
            type: '',
            material: '',
            width: '',
            length: '',
            pattern: '',
            brand: '',
            color: '',
            remark: ''
        };

        tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            if (tagLower.startsWith('book:')) metadata.book = tag.substring(5);
            else if (tagLower.startsWith('page:')) metadata.page = tag.substring(5);
            else if (tagLower.startsWith('row:')) metadata.row = tag.substring(4);
            else if (tagLower.startsWith('column:')) metadata.column = tag.substring(7);
            else if (tagLower.startsWith('type:')) metadata.type = tag.substring(5);
            else if (tagLower.startsWith('material:')) metadata.material = tag.substring(9);
            else if (tagLower.startsWith('width:')) metadata.width = tag.substring(6);
            else if (tagLower.startsWith('length:')) metadata.length = tag.substring(7);
            else if (tagLower.startsWith('pattern:')) metadata.pattern = tag.substring(8);
            else if (tagLower.startsWith('brand:')) metadata.brand = tag.substring(6);
            else if (tagLower.startsWith('color:')) metadata.color = tag.substring(6);
            else if (tagLower.startsWith('remark:')) metadata.remark = tag.substring(7);
        });
        
        // If there's a pending pattern change, use that instead (for UI display)
        if (pendingPatternChange) {
            metadata.pattern = pendingPatternChange;
        }

        // Build HTML with editable fields - Pattern first
        let html = '<div class="lightbox-metadata-section">';
        html += '<h4>Pattern</h4>';
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Pattern:</span>
            <div class="lightbox-pattern-dropdown-wrapper">
                <div class="lightbox-pattern-dropdown">
                    <div class="lightbox-pattern-dropdown-toggle" data-field="pattern">
                        <span class="lightbox-pattern-dropdown-text">${metadata.pattern || 'Select Pattern...'}</span>
                        <span class="lightbox-pattern-dropdown-arrow">▼</span>
                    </div>
                    <div class="lightbox-pattern-dropdown-menu is-hidden">
                        <div class="lightbox-pattern-dropdown-options">
                            <!-- Options will be populated by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>
            <div id="lightbox-selected-pattern-preview" class="lightbox-selected-pattern-preview is-hidden">
                <div class="lightbox-pattern-preview-content">
                    <img id="lightbox-selected-pattern-thumbnail" class="lightbox-pattern-thumbnail-preview" src="" alt="Pattern thumbnail" />
                    <span id="lightbox-selected-pattern-name" class="lightbox-pattern-name-preview"></span>
                </div>
            </div>
        </div>`;
        html += '</div>';

        html += '<div class="lightbox-metadata-section">';
        html += '<h4>Location</h4>';
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Book:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="book">${metadata.book}</div>
        </div>`;
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Page:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="page">${metadata.page}</div>
        </div>`;
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Row:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="row">${metadata.row}</div>
        </div>`;
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Column:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="column">${metadata.column}</div>
        </div>`;
        html += '</div>';

        html += '<div class="lightbox-metadata-section">';
        html += '<h4>Item Details</h4>';
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Type:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="type">${metadata.type}</div>
        </div>`;
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Material:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="material">${metadata.material}</div>
        </div>`;
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Width (mm):</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="width">${metadata.width}</div>
        </div>`;
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Length (mm):</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="length">${metadata.length}</div>
        </div>`;
        html += '</div>';

        html += '<div class="lightbox-metadata-section">';
        html += '<h4>Other</h4>';
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Brand:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="brand">${metadata.brand}</div>
        </div>`;
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Color:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="color">${metadata.color}</div>
        </div>`;
        html += `<div class="lightbox-metadata-field">
            <span class="lightbox-metadata-label">Remark:</span>
            <div class="lightbox-metadata-value" contenteditable="true" data-field="remark">${metadata.remark}</div>
        </div>`;
        html += '</div>';

        metadataPanel.innerHTML = html;
        
        // Load patterns into dropdown and set up event listeners
        setupLightboxPatternDropdown(index);
    }

    // Setup lightbox pattern dropdown
    async function setupLightboxPatternDropdown(index) {
        const dropdownToggle = document.querySelector('.lightbox-pattern-dropdown-toggle');
        const dropdownMenu = document.querySelector('.lightbox-pattern-dropdown-menu');
        const dropdownOptions = document.querySelector('.lightbox-pattern-dropdown-options');
        const dropdownText = dropdownToggle ? dropdownToggle.querySelector('.lightbox-pattern-dropdown-text') : null;
        
        if (!dropdownToggle || !dropdownMenu || !dropdownOptions) return;

        // Load patterns
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${API_URL}/api/patterns`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error('Failed to load patterns:', response.status);
                return;
            }

            const patterns = await response.json();
            
            // Clear existing options
            dropdownOptions.innerHTML = '';

            if (patterns.length === 0) {
                const noPatternsOption = document.createElement('div');
                noPatternsOption.className = 'lightbox-pattern-dropdown-option';
                noPatternsOption.textContent = 'No patterns available';
                noPatternsOption.style.padding = '10px';
                noPatternsOption.style.color = '#999';
                dropdownOptions.appendChild(noPatternsOption);
            } else {
                // Get current pattern from image
                const image = currentLightboxImages[index];
                const tags = image.tags || [];
                let currentPattern = '';
                tags.forEach(tag => {
                    if (tag.toLowerCase().startsWith('pattern:')) {
                        currentPattern = tag.substring(8);
                    }
                });

                // Add patterns to dropdown
                let selectedPatternData = null;
                patterns.forEach(pattern => {
                    const option = document.createElement('div');
                    option.className = 'lightbox-pattern-dropdown-option';
                    option.dataset.patternId = pattern.id;
                    option.dataset.patternName = pattern.name || 'Unnamed Pattern';
                    option.dataset.patternFilepath = pattern.filepath;
                    
                    // Mark as selected if this matches current pattern
                    if (pattern.name === currentPattern) {
                        option.classList.add('selected');
                        selectedPatternData = pattern;
                    }
                    
                    // Create thumbnail container
                    const thumbnailContainer = document.createElement('div');
                    thumbnailContainer.className = 'lightbox-pattern-option-thumbnail';
                    
                    const img = document.createElement('img');
                    const filename = pattern.filepath.split(/[/\\]/).pop();
                    img.src = `${API_URL}/uploads/patterns/${filename}`;
                    img.alt = pattern.name || 'Pattern';
                    img.onerror = function() {
                        this.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'lightbox-pattern-option-placeholder';
                        placeholder.innerHTML = '📄';
                        thumbnailContainer.appendChild(placeholder);
                    };
                    
                    thumbnailContainer.appendChild(img);
                    
                    // Create name container
                    const nameContainer = document.createElement('div');
                    nameContainer.className = 'lightbox-pattern-option-name';
                    nameContainer.textContent = pattern.name || 'Unnamed Pattern';
                    
                    option.appendChild(thumbnailContainer);
                    option.appendChild(nameContainer);
                    
                    // Add click handler
                    option.addEventListener('click', async () => {
                        if (lightboxLocked) {
                            showLightboxToast('Fields are locked. Click the lock icon to unlock.');
                            return;
                        }
                        await selectLightboxPattern(index, pattern.id, pattern.name || 'Unnamed Pattern', pattern.filepath);
                    });
                    
                    dropdownOptions.appendChild(option);
                });
                
                // Show preview if a pattern is already selected
                if (selectedPatternData) {
                    const selectedPatternPreview = document.getElementById('lightbox-selected-pattern-preview');
                    const selectedPatternThumbnail = document.getElementById('lightbox-selected-pattern-thumbnail');
                    const selectedPatternName = document.getElementById('lightbox-selected-pattern-name');
                    
                    if (selectedPatternName) {
                        selectedPatternName.textContent = selectedPatternData.name || 'Unnamed Pattern';
                    }
                    
                    if (selectedPatternThumbnail && selectedPatternData.filepath) {
                        const filename = selectedPatternData.filepath.split(/[/\\]/).pop();
                        selectedPatternThumbnail.src = `${API_URL}/uploads/patterns/${filename}`;
                        selectedPatternThumbnail.onerror = function() {
                            this.style.display = 'none';
                        };
                        selectedPatternThumbnail.style.display = 'block';
                    }
                    
                    if (selectedPatternPreview) {
                        selectedPatternPreview.classList.remove('is-hidden');
                    }
                }
            }
        } catch (error) {
            console.error('Error loading patterns into lightbox dropdown:', error);
        }

        // Toggle dropdown on click
        dropdownToggle.addEventListener('click', (e) => {
            if (lightboxLocked) {
                showLightboxToast('Fields are locked. Click the lock icon to unlock.');
                return;
            }
            e.stopPropagation();
            dropdownMenu.classList.toggle('is-hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (dropdownMenu && !dropdownMenu.contains(e.target) && 
                dropdownToggle && !dropdownToggle.contains(e.target)) {
                dropdownMenu.classList.add('is-hidden');
            }
        });
    }

    // Select pattern in lightbox
    async function selectLightboxPattern(index, patternId, patternName, patternFilepath) {
        const image = currentLightboxImages[index];
        if (!image) return;

        // Update dropdown text
        const dropdownText = document.querySelector('.lightbox-pattern-dropdown-text');
        if (dropdownText) {
            dropdownText.textContent = patternName;
        }

        // Update selected state in dropdown
        const allOptions = document.querySelectorAll('.lightbox-pattern-dropdown-option');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        const selectedOption = document.querySelector(`[data-pattern-id="${patternId}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Hide dropdown menu (close after selection)
        const dropdownMenu = document.querySelector('.lightbox-pattern-dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.classList.add('is-hidden');
        }

        // Show preview with thumbnail and name
        const selectedPatternPreview = document.getElementById('lightbox-selected-pattern-preview');
        const selectedPatternThumbnail = document.getElementById('lightbox-selected-pattern-thumbnail');
        const selectedPatternName = document.getElementById('lightbox-selected-pattern-name');
        
        if (selectedPatternName) {
            selectedPatternName.textContent = patternName;
        }
        
        if (selectedPatternThumbnail && patternFilepath) {
            const filename = patternFilepath.split(/[/\\]/).pop();
            selectedPatternThumbnail.src = `${API_URL}/uploads/patterns/${filename}`;
            selectedPatternThumbnail.onerror = function() {
                this.style.display = 'none';
            };
            selectedPatternThumbnail.style.display = 'block';
        }
        
        if (selectedPatternPreview) {
            selectedPatternPreview.classList.remove('is-hidden');
        }

        // Store pattern change in pending state (don't update image.tags yet)
        // Only apply when user clicks save button
        pendingPatternChange = patternName;
        
        // Mark as dirty so save button appears - pattern will be saved when user clicks save
        lightboxDirty = true;
        
        // Show save button if it exists and fields are unlocked
        if (lightboxSaveBtn && !lightboxLocked) {
            lightboxSaveBtn.classList.remove('is-hidden');
        }
    }

    // Lock all lightbox fields (metadata, frequency panel, tag input)
    function lockLightboxFields() {
        lightboxLocked = true;
        if (lightboxLockBtn) {
            // Update to locked icon (closed lock)
            const lockIcon = lightboxLockBtn.querySelector('.lock-icon');
            if (lockIcon) {
                lockIcon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
            }
            lightboxLockBtn.classList.remove('unlocked');
            lightboxLockBtn.title = 'Click to unlock editing';
            lightboxLockBtn.style.right = '70px';
        }
        // Hide save button when locked
        if (lightboxSaveBtn) {
            lightboxSaveBtn.classList.add('is-hidden');
        }

        // Lock metadata fields
        const metadataValues = document.querySelectorAll('.lightbox-metadata-value');
        metadataValues.forEach(field => {
            field.contentEditable = 'false';
            field.style.pointerEvents = 'none';
            field.style.opacity = '0.7';
            field.style.cursor = 'not-allowed';
        });

        // Lock frequency panel items (but preserve disabled state for already-added tags)
        const freqItems = document.querySelectorAll('.lightbox-freq-item');
        freqItems.forEach(item => {
            // If item is already disabled (tag already in image), keep it disabled
            if (item.classList.contains('disabled')) {
                item.style.pointerEvents = 'none';
                item.style.opacity = '0.4'; // Keep disabled opacity
                item.style.cursor = 'not-allowed';
            } else {
                // For non-disabled items, apply lock styling
                item.style.pointerEvents = 'none';
                item.style.opacity = '0.5';
                item.style.cursor = 'not-allowed';
            }
        });

        // Lock tag input field
        const tagInput = document.querySelector('.lightbox-tag-add input');
        if (tagInput) {
            tagInput.disabled = true;
            tagInput.style.opacity = '0.5';
            tagInput.style.cursor = 'not-allowed';
        }

        // Lock pattern dropdown
        const patternDropdownToggle = document.querySelector('.lightbox-pattern-dropdown-toggle');
        if (patternDropdownToggle) {
            patternDropdownToggle.style.pointerEvents = 'none';
            patternDropdownToggle.style.opacity = '0.7';
            patternDropdownToggle.style.cursor = 'not-allowed';
        }

        // Ensure tag chips and remove buttons remain clickable (remove buttons will check lock state in handler)
        const tagChips = document.querySelectorAll('.lightbox-tag-chip');
        tagChips.forEach(chip => {
            // Ensure chip doesn't block pointer events to its children (remove buttons)
            chip.style.pointerEvents = 'auto';
        });
        
        const tagRemoveButtons = document.querySelectorAll('.lightbox-tag-remove');
        tagRemoveButtons.forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.style.cursor = 'pointer';
        });
    }

    // Unlock all lightbox fields
    function unlockLightboxFields() {
        lightboxLocked = false;
        if (lightboxLockBtn) {
            // Update to unlocked icon (open lock - shackle is open)
            const lockIcon = lightboxLockBtn.querySelector('.lock-icon');
            if (lockIcon) {
                lockIcon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 5-5 5 5 0 0 1 5 5"></path><line x1="12" y1="16" x2="12" y2="22"></line>';
            }
            lightboxLockBtn.classList.add('unlocked');
            lightboxLockBtn.title = 'Click to lock editing';
            lightboxLockBtn.style.right = '120px';
        }
        // Show save button when unlocked (positioned at 70px, between close and lock)
        if (lightboxSaveBtn) {
            lightboxSaveBtn.style.right = '70px';
            lightboxSaveBtn.classList.remove('is-hidden');
        }

        // Unlock metadata fields
        const metadataValues = document.querySelectorAll('.lightbox-metadata-value');
        metadataValues.forEach(field => {
            field.contentEditable = 'true';
            field.style.pointerEvents = 'auto';
            field.style.opacity = '1';
            field.style.cursor = 'text';
        });

        // Unlock frequency panel items (but preserve disabled state for already-added tags)
        const freqItems = document.querySelectorAll('.lightbox-freq-item');
        freqItems.forEach(item => {
            // If item is disabled (tag already in image), keep it disabled
            if (item.classList.contains('disabled')) {
                item.style.pointerEvents = 'none';
                item.style.opacity = '0.4'; // Keep disabled opacity
                item.style.cursor = 'not-allowed';
            } else {
                // For non-disabled items, restore normal interactivity
                item.style.pointerEvents = 'auto';
                item.style.opacity = '1';
                item.style.cursor = 'pointer';
            }
        });

        // Unlock tag input field
        const tagInput = document.querySelector('.lightbox-tag-add input');
        if (tagInput) {
            tagInput.disabled = false;
            tagInput.style.opacity = '1';
            tagInput.style.cursor = 'text';
        }

        // Unlock pattern dropdown
        const patternDropdownToggle = document.querySelector('.lightbox-pattern-dropdown-toggle');
        if (patternDropdownToggle) {
            patternDropdownToggle.style.pointerEvents = 'auto';
            patternDropdownToggle.style.opacity = '1';
            patternDropdownToggle.style.cursor = 'pointer';
        }
    }

    function openLibraryLightbox(index) {
        pendingAddTags.clear();
        pendingRemoveTags.clear();
        pendingPatternChange = null;
        lightboxDirty = false;
        // Reset project view flag if not already set (for regular library view)
        // isProjectViewLightbox will be set to true in openProjectImageLightbox
        
        // In pool view, create a properly formatted array from allImagesToDisplay
        // that matches libraryImages structure (with src property)
        if (isPoolView && allImagesToDisplay.length > 0) {
            // Format allImagesToDisplay to match libraryImages structure
            currentLightboxImages = allImagesToDisplay.map((img, idx) => {
                // Try to find matching image in libraryImages first (has src already)
                const libImg = libraryImages.find(lib => lib.id === img.id);
                if (libImg) {
                    return libImg;
                }
                // Otherwise create formatted object from raw image
                return {
                    src: `${API_URL}/${img.filepath.replace(/\\/g, '/')}`,
                    index: idx,
                    tags: img.tags || [],
                    id: img.id,
                    loaded: true,
                    filepath: img.filepath
                };
            });
            currentImageIndex = index;
        } else {
            // Regular library view - use libraryImages directly
            currentLightboxImages = libraryImages;
            currentImageIndex = index;
        }
        
        // Ensure all images have src property
        imageSources = currentLightboxImages.map(img => {
            if (img.src) return img.src;
            if (img.filepath) return `${API_URL}/${img.filepath.replace(/\\/g, '/')}`;
            return '';
        });
        
        if (currentImageIndex >= 0 && currentImageIndex < imageSources.length && currentImageIndex < currentLightboxImages.length) {
            modalImg.src = imageSources[currentImageIndex];
            displayLightboxMetadata(currentImageIndex);
            displayLightboxTags(currentImageIndex);
            if (currentLightboxImages[currentImageIndex]) {
                renderLightboxFreqFloating(currentLightboxImages[currentImageIndex].id);
            }
        }
        modal.classList.remove('is-hidden');
        
        // Reset scroll position of metadata panel to top
        const metadataPanel = document.getElementById('lightbox-metadata-panel');
        if (metadataPanel) {
            metadataPanel.scrollTop = 0;
        }
        // In project view, keep lock button hidden (read-only mode)
        if (isProjectViewLightbox) {
            if (lightboxLockBtn) lightboxLockBtn.classList.add('is-hidden');
            if (lightboxSaveBtn) lightboxSaveBtn.classList.add('is-hidden');
        } else {
            if (lightboxLockBtn) lightboxLockBtn.classList.remove('is-hidden');
            if (lightboxSaveBtn && !lightboxLocked) lightboxSaveBtn.classList.remove('is-hidden');
        }
        // Lock all fields after rendering (with small delay to ensure DOM is ready)
        setTimeout(() => {
            lockLightboxFields();
        }, 100);
        updateArrowVisibility();
    }

    function showLibraryImage(index) {
        if (index >= imageSources.length || index < 0) return;
        currentImageIndex = index;
        modalImg.src = imageSources[currentImageIndex];
        displayLightboxMetadata(index);
        displayLightboxTags(index);
        if (currentLightboxImages[index]) {
            renderLightboxFreqFloating(currentLightboxImages[index].id);
        }
        // In project view, keep lock button hidden (read-only mode)
        if (isProjectViewLightbox) {
            if (lightboxLockBtn) lightboxLockBtn.classList.add('is-hidden');
            if (lightboxSaveBtn) lightboxSaveBtn.classList.add('is-hidden');
        } else {
            if (lightboxLockBtn) lightboxLockBtn.classList.remove('is-hidden');
            if (lightboxSaveBtn && !lightboxLocked) lightboxSaveBtn.classList.remove('is-hidden');
        }
        // Lock all fields after rendering (with small delay to ensure DOM is ready)
        setTimeout(() => {
            lockLightboxFields();
        }, 100);
        updateArrowVisibility();
        
        // Reset scroll position of metadata panel to top
        const metadataPanel = document.getElementById('lightbox-metadata-panel');
        if (metadataPanel) {
            metadataPanel.scrollTop = 0;
        }
    }

    // --- Search Tag Chip Functions ---

    function getColorForSearchTag(text) {
        const key = text.toLowerCase();
        if (searchTagColors[key]) return searchTagColors[key];

        const palette = [
            '#2196F3', // blue
            '#4CAF50', // green
            '#FF9800', // orange
            '#9C27B0', // purple
            '#00BCD4', // cyan
            '#3F51B5', // indigo
            '#8BC34A', // light green
            '#FFC107', // amber
            '#795548', // brown
            '#607D8B'  // blue grey
        ];

        let color = null;
        for (const c of palette) {
            if (!usedSearchColors.has(c)) {
                color = c;
                break;
            }
        }
        if (!color) {
            color = '#4CAF50';
        }
        searchTagColors[key] = color;
        usedSearchColors.add(color);
        return color;
    }

    async function addSearchTagChip(tagText) {
        const text = tagText.toLowerCase().trim();
        if (!text) return;

        // Check if tag already exists
        if (searchTags.some(tag => tag.text === text)) return;

        // Reset forceLibraryView when user actively adds new tags
        // This allows auto-switching to Selection Pool after "Back to Library"
        forceLibraryView = false;
        console.log('Reset forceLibraryView to false when adding new tag:', text);

        // Visible chips now represent active search tags again
        chipsReferenceOnly = false;

        // Track tag input timestamp for ordering (most recent input first)
        const currentTimestamp = Date.now();
        tagCreationOrder[text] = currentTimestamp;
        console.log(`Tag "${text}" input at timestamp:`, currentTimestamp);
        
        // Save the updated tag order
        saveTagCreationOrder();

        // Add to searchTags array (newest at the front)
        searchTags.unshift({ text: text, hasMatches: true });

        // Create chip element with count
        const chip = document.createElement('span');
        chip.className = 'chip search-chip';

        // Get image count for this tag (to determine matches / no-matches)
        let imageCount = 0;
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            if (exactWordMode) {
                // Exact mode: ask backend for exact tag matches (subjective tags only)
                const response = await fetch(`${API_URL}/images?tags=${text}&mode=OR&match=exact`, {
                    headers: headers
                });
                const images = await response.json();
                imageCount = images.length;
            } else {
                // Partial mode: fetch all visible images and count via substring match
                const allImagesResponse = await fetch(`${API_URL}/images`, { headers });
                const allImages = allImagesResponse.ok ? await allImagesResponse.json() : [];
                const searchLower = text.toLowerCase();
                const matchingImages = allImages.filter(img =>
                    (img.tags || [])
                        // Only consider subjective/feeling tags (no colon prefix)
                        .filter(t => typeof t === 'string' && !t.includes(':'))
                        .some(t => t.toLowerCase().includes(searchLower))
                );
                imageCount = matchingImages.length;
            }
        } catch (error) {
            console.error(`Error getting count for tag "${text}":`, error);
        }

        // Temporary order; we'll renumber all chips after insertion
        let order = 1;

        if (imageCount === 0) {
            // Mark as no matches - red box
            chip.className = 'chip search-chip no-matches';
            chip.textContent = `#${order} ${text} (0)`;
            // Update searchTags entry
            const tagEntry = searchTags.find(t => t.text === text);
            if (tagEntry) tagEntry.hasMatches = false;
        } else {
            // Tag has matches - assign a non-red color and show count
            const color = getColorForSearchTag(text);
            chip.className = 'chip search-chip has-matches';
            chip.style.backgroundColor = color;
            chip.style.borderColor = color;
            chip.style.color = '#ffffff';
            chip.textContent = `#${order} ${text} (${imageCount})`;

            const tagEntry = searchTags.find(t => t.text === text);
            if (tagEntry) tagEntry.hasMatches = true;
        }
        chip.tabIndex = 0;
        chip.dataset.tag = text;
        chip.dataset.count = String(imageCount);

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'chip-delete';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Always confirm before clearing this tag and its selected images
            showTagRemovalConfirmation(tagText);
        });

        chip.appendChild(deleteBtn);
        // Insert newest chip at the beginning so it appears on the left
        if (librarySearchChips.firstChild) {
            librarySearchChips.insertBefore(chip, librarySearchChips.firstChild);
        } else {
            librarySearchChips.appendChild(chip);
        }

        // Renumber all chips so leftmost is highest # and rightmost is #1
        renumberSearchChips();
        updateClearButtonState();
    }

    function renumberSearchChips() {
        // Remove all existing separators first
        const existingSeparators = librarySearchChips.querySelectorAll('.chip-separator');
        existingSeparators.forEach(sep => sep.remove());
        
        const chips = Array.from(librarySearchChips.querySelectorAll('.search-chip'));
        chips.forEach((chip, index) => {
            // Rightmost (newest) chip is #1, then #2, etc.
            const order = chips.length - index;
            const tag = chip.dataset.tag || '';
            const count = chip.dataset.count || '';

            // Preserve class and color, only change the label text
            if (chip.classList.contains('no-matches')) {
                chip.textContent = `#${order} ${tag} (0)`;
            } else {
                chip.textContent = `#${order} ${tag} (${count})`;
            }

            // Re-append delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'chip-delete';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showTagRemovalConfirmation(tag);
            });
            chip.appendChild(deleteBtn);
            
            // Add separator after each chip (except the last one) if there are 2+ chips
            if (index < chips.length - 1 && chips.length > 1) {
                const separator = document.createElement('span');
                separator.className = 'chip-separator';
                separator.textContent = tagSearchMode.toLowerCase(); // 'or' or 'and' (text only, lowercase)
                separator.style.margin = '0 8px';
                separator.style.color = '#ffffff'; // White text
                separator.style.backgroundColor = '#ff0000'; // Red circle background
                separator.style.borderRadius = '50%'; // Make it circular
                separator.style.width = '28px'; // Increased size for better spacing
                separator.style.height = '28px'; // Increased size for better spacing
                separator.style.display = 'inline-flex';
                separator.style.alignItems = 'center'; // Vertical center alignment
                separator.style.justifyContent = 'center'; // Horizontal center alignment
                separator.style.fontSize = '11px'; // Slightly smaller font for better fit
                separator.style.fontWeight = '600';
                separator.style.userSelect = 'none';
                separator.style.lineHeight = '1';
                separator.style.textAlign = 'center'; // Ensure text is centered
                separator.style.padding = '0'; // No padding needed with flexbox centering
                separator.style.boxSizing = 'border-box'; // Ensure padding is included in size
                
                // Insert separator after the chip
                chip.parentNode.insertBefore(separator, chip.nextSibling);
            }
        });
    }

    function removeSearchTagChipInPoolView(tagText) {
        console.log('=== removeSearchTagChipInPoolView START ===');
        console.log('Removing tag in pool view:', tagText, 'MUST stay in pool view');
        
        const originalPoolView = isPoolView; // Preserve original state
        
        // Remove from searchTags array
        searchTags = searchTags.filter(tag => tag.text !== tagText);
        console.log('After removing tag, searchTags.length:', searchTags.length);

        // Remove from tagCreationOrder (this tag is no longer tracked)
        delete tagCreationOrder[tagText];
        saveTagCreationOrder();

        // Find images that have the removed tag and remove them from selected images
        const imagesToRemove = [];
        
        selectedImages.forEach(imageId => {
            const image = libraryImages.find(img => img.id === imageId);
            if (image && image.tags && image.tags.includes(tagText)) {
                imagesToRemove.push(imageId);
            }
        });

        // Remove these images from selections
        selectedImages = selectedImages.filter(id => !imagesToRemove.includes(id));
        tagSelectedImages = tagSelectedImages.filter(id => !imagesToRemove.includes(id));

        // Remove selection timestamps for removed images
        imagesToRemove.forEach(imageId => {
            delete imageSelectionOrder[imageId];
        });

        console.log('Removed images with tag "' + tagText + '":', imagesToRemove);
        console.log('Remaining selectedImages:', selectedImages.length);

        // Show notification about tag removal and image deselection
        if (imagesToRemove.length > 0) {
            showTagRemovalNotification(tagText, imagesToRemove.length);
        }

        // Remove chip from DOM
        const chips = librarySearchChips.querySelectorAll('.search-chip');
        chips.forEach(chip => {
            const chipTag = (chip.dataset.tag || '').toLowerCase();
            if (chipTag === tagText.toLowerCase()) {
                chip.remove();
            }
        });

        // Keep input visually empty; chips represent current tags
        librarySearchInput.value = '';
        
        // Force preserve pool view state
        isPoolView = originalPoolView;
        console.log('Forced isPoolView back to:', isPoolView);
        
        renumberSearchChips();
        updateClearButtonState();
        
        // Directly refresh pool view without calling any functions that might reset state
        console.log('About to refresh pool view display');
        displayLibraryImages();
        
        // Double-check pool view state after display
        if (!isPoolView && originalPoolView) {
            console.log('WARNING: isPoolView was reset! Forcing it back to true');
            isPoolView = true;
            updateLibraryTitle(true);
        }
        
        console.log('=== removeSearchTagChipInPoolView END ===');
        console.log('Final isPoolView:', isPoolView);
    }

    function removeSearchTagChip(tagText) {
        console.log('=== removeSearchTagChip START ===');
        console.log('removeSearchTagChip called for tag:', tagText, 'isPoolView:', isPoolView);
        
        // Remove from searchTags array
        searchTags = searchTags.filter(tag => tag.text !== tagText);
        console.log('After removing tag, searchTags.length:', searchTags.length);

        // Also clear stored color for this tag so it can be reused later
        if (searchTagColors && searchTagColors[tagText.toLowerCase()]) {
            const color = searchTagColors[tagText.toLowerCase()];
            delete searchTagColors[tagText.toLowerCase()];
            if (usedSearchColors && usedSearchColors.has(color)) {
                usedSearchColors.delete(color);
            }
        }

        // Remove from tagCreationOrder (this tag is no longer tracked)
        delete tagCreationOrder[tagText];
        saveTagCreationOrder();

        // Find images that have the removed tag and remove them from selected images
        const imagesToRemove = [];
        
        selectedImages.forEach(imageId => {
            const image = libraryImages.find(img => img.id === imageId);
            if (image && image.tags && image.tags.includes(tagText)) {
                imagesToRemove.push(imageId);
            }
        });

        // Remove these images from selections
        selectedImages = selectedImages.filter(id => !imagesToRemove.includes(id));
        tagSelectedImages = tagSelectedImages.filter(id => !imagesToRemove.includes(id));

        // Remove selection timestamps for removed images
        imagesToRemove.forEach(imageId => {
            delete imageSelectionOrder[imageId];
        });

        console.log('Removed images with tag "' + tagText + '":', imagesToRemove);
        console.log('Remaining selectedImages:', selectedImages.length);

        // Show notification about tag removal and image deselection
        if (imagesToRemove.length > 0) {
            showTagRemovalNotification(tagText, imagesToRemove.length);
        }

        // Remove chip from DOM
        const chips = librarySearchChips.querySelectorAll('.search-chip');
        chips.forEach(chip => {
            const chipTag = (chip.dataset.tag || '').toLowerCase();
            if (chipTag === tagText.toLowerCase()) {
                chip.remove();
            }
        });

        // Keep input visually empty; chips represent current tags
        console.log('About to renumber chips after removal, isPoolView:', isPoolView);
        renumberSearchChips();
        updateClearButtonState();
        console.log('After updateClearButtonState, isPoolView:', isPoolView);
        
        // Stay in selection pool view if we were there
        const wasInPoolView = isPoolView;
        console.log('wasInPoolView saved as:', wasInPoolView);
        
        if (wasInPoolView) {
            // Keep in pool view and refresh to show remaining selected images
            console.log('About to call displayLibraryImages in pool view mode');
            displayLibraryImages();
        } else {
            // If we were in library view, refresh the library view
            console.log('About to call displayLibraryImages in library view mode');
            displayLibraryImages();
        }
        
        console.log('=== removeSearchTagChip END ===');
        console.log('Final isPoolView:', isPoolView);
    }



    function clearAllSearchChips() {
        console.log('=== clearAllSearchChips CALLED ===');
        console.log('clearAllSearchChips called - clearing everything and returning to main library');
        console.log('Before clear - searchTags:', searchTags.length, 'selectedImages:', selectedImages.length, 'tagSelectedImages:', tagSelectedImages.length, 'isPoolView:', isPoolView);

        chipsReferenceOnly = false;

        // Clear all search tags
        searchTags = [];
        searchPatterns = []; // Clear search patterns
        tagSelectedImages = []; // Clear tag-selected images
        imageSelectionSource = {}; // Clear selection source tracking
        librarySearchChips.innerHTML = '';


        // Clear all selected images
        selectedImages = [];

        // Clear all selection timestamps
        imageSelectionOrder = {};

        // Remove visual selection styling from all cards
        const cards = document.querySelectorAll('.library-card');
        cards.forEach(card => {
            card.classList.remove('selected');
            card.classList.remove('manual-selection');
            card.classList.remove('tag-selection');
        });

        // Ensure we're in main library view (not pool view)
        console.log('clearAllSearchChips - SETTING isPoolView = false');
        isPoolView = false;

        // Update UI states
        updateClearButtonState();
        // Note: updateSelectionState is async but we don't await here since displayLibraryImages will refresh everything
        updateSelectionState();

        // Refresh to show full library with no selections or filters
        displayLibraryImages();

        console.log('After clear - returned to main library with no selections or filters');
        console.log('Final state - searchTags:', searchTags.length, 'selectedImages:', selectedImages.length, 'isPoolView:', isPoolView);
        console.log('=== clearAllSearchChips END ===');
    }



    function updateSearchInput() {
        // We keep the visible input EMPTY; chips below represent current tags.
        // Only manage the programmaticUpdate flag so clearing doesn't wipe chips.
        librarySearchInput.dataset.programmaticUpdate = 'true';
        librarySearchInput.value = '';

        // Remove the flag shortly after to resume normal behavior.
        requestAnimationFrame(() => {
            setTimeout(() => {
                delete librarySearchInput.dataset.programmaticUpdate;
            }, 50);
        });
    }

    function updateClearButtonState() {
        // Simple: disable button when 0 selected images
        const totalSelections = [...new Set([...selectedImages, ...tagSelectedImages])].length;

        if (totalSelections === 0) {
            clearAllTagsBtn.disabled = true;
            clearAllTagsBtn.style.opacity = '0.5';
            clearAllTagsBtn.style.cursor = 'not-allowed';
            clearAllTagsBtn.style.backgroundColor = '#ccc';
        } else {
            clearAllTagsBtn.disabled = false;
            clearAllTagsBtn.style.opacity = '1';
            clearAllTagsBtn.style.cursor = 'pointer';
            clearAllTagsBtn.style.backgroundColor = '';
        }
    }

    function initializeFreshSearchInput() {
        // Clear any cached or remembered values
        librarySearchInput.value = '';
        librarySearchInput.defaultValue = '';

        // Clear any browser autocomplete cache for this session
        if (librarySearchInput.form) {
            librarySearchInput.form.reset();
        }

        // Force clear any browser-stored values
        setTimeout(() => {
            librarySearchInput.value = '';
        }, 0);

        // NOTE: Do not clear existing chips here; only reset the raw input field.
    }

    function getMatchingTags(imageTags, searchTags) {
        if (!imageTags || !searchTags || searchTags.length === 0) {
            return [];
        }

        // Consider subjective tags (no colon) AND pattern tags (pattern: prefix)
        // Exclude other metadata tags (book:, page:, etc.)
        const objectivePrefixes = ['book:', 'page:', 'row:', 'column:', 'type:', 'material:', 'width:', 'length:', 'remark:', 'brand:', 'color:'];
        const searchableTags = imageTags.filter(t => {
            if (typeof t !== 'string') return false;
            const tagLower = t.toLowerCase();
            // Include pattern: tags and tags without colons (subjective tags)
            return tagLower.startsWith('pattern:') || (!tagLower.includes(':') && !objectivePrefixes.some(prefix => tagLower.startsWith(prefix)));
        });

        return searchableTags.filter(imageTag =>
            searchTags.some(searchTag => {
                const imageTagLower = imageTag.toLowerCase();
                const searchLower = searchTag.toLowerCase();
                if (!searchLower) return false;
                return exactWordMode
                    ? imageTagLower === searchLower
                    : imageTagLower.includes(searchLower);
            })
        );
    }

    function getActiveSearchTagTexts() {
        if (searchTags && searchTags.length > 0) {
            return searchTags.map(tag => tag.text);
        }

        if (chipsReferenceOnly) {
            return [];
        }

        const chipContainer = document.getElementById('library-search-chips');
        if (!chipContainer) return [];

        const chips = Array.from(chipContainer.querySelectorAll('.search-chip'));
        return chips
            .map(chip => (chip.dataset.tag || '').trim())
            .filter(t => t);
    }

    // Get current displayed tags in lightbox (what user actually sees)
    function getCurrentDisplayedTags(index) {
        if (index >= currentLightboxImages.length || index < 0) {
            return [];
        }

        const currentImage = currentLightboxImages[index];
        // Get all tags (including pattern tags and subjective tags)
        const allImageTags = currentImage.tags || [];
        
        // Apply pending removals
        const tagsAfterRemoval = allImageTags.filter(tag => !pendingRemoveTags.has(tag));
        
        // Add pending additions
        const displayedTags = [...new Set([...tagsAfterRemoval, ...pendingAddTags])];
        
        return displayedTags;
    }

    function displayLightboxTags(index) {
        if (index >= currentLightboxImages.length || index < 0) {
            lightboxTags.innerHTML = '';
            return;
        }

        const currentImage = currentLightboxImages[index];
        // Show subjective/feeling tags and pattern tags (exclude other metadata with prefixes)
        const imageTags = (currentImage.tags || []).filter(t => {
            // Always include pattern tags
            if (t && t.toLowerCase().startsWith('pattern:')) return true;
            // Include non-objective tags
            return !isObjectiveTag(t);
        });
        lightboxTags.innerHTML = '';

        // Left column: tag list + add input (frequency panel floats separately)
        const tagList = document.createElement('div');
        tagList.className = 'lightbox-tag-list';

        // Render existing + pending chips, excluding pending removals
        const tagsAfterRemoval = imageTags.filter(tag => !pendingRemoveTags.has(tag));
        const allTagSet = new Set([...tagsAfterRemoval, ...pendingAddTags]);
        if (allTagSet.size === 0) {
            const empty = document.createElement('span');
            empty.className = 'no-tags';
            empty.textContent = 'No tags';
            tagList.appendChild(empty);
        } else {
            // Sort tags so pattern tags always appear last
            const sortedTags = Array.from(allTagSet).sort((a, b) => {
                const aIsPattern = a.toLowerCase().startsWith('pattern:');
                const bIsPattern = b.toLowerCase().startsWith('pattern:');
                // If both are pattern tags or both are not, maintain original order
                if (aIsPattern === bIsPattern) return 0;
                // Pattern tags go to the end (return 1 means a comes after b)
                return aIsPattern ? 1 : -1;
            });
            
            sortedTags.forEach(tagText => {
            const chip = document.createElement('span');
            chip.className = 'lightbox-tag-chip';

            // Check if this is a pattern tag
            const isPatternTag = tagText.toLowerCase().startsWith('pattern:');
            
            // Apply blue background for pattern tags
            if (isPatternTag) {
                chip.style.backgroundColor = '#007bff';
                chip.style.color = '#fff';
                chip.style.border = '1px solid #0056b3';
            }

            // Get current search tags for highlighting
            const currentSearchTags = searchTags.map(tag => tag.text);
            const tagLower = tagText.toLowerCase();

            // Find all matching search terms in this tag
            const matchingSearchTerms = currentSearchTags.filter(searchTag => {
                const searchLower = searchTag.toLowerCase();
                if (!searchLower) return false;
                return exactWordMode
                    ? tagLower === searchLower
                    : tagLower.includes(searchLower);
            });

            if (matchingSearchTerms.length > 0) {
                // Add thicker border to the whole tag element
                chip.style.border = '2px solid #ffd700';
                chip.style.boxShadow = '0 0 4px rgba(255, 215, 0, 0.5)';

                // In exact word mode, highlight the whole tag
                if (exactWordMode) {
                    // For pattern tags, keep blue background but add gold border
                    if (!isPatternTag) {
                        chip.style.backgroundColor = '#ffd700';
                        chip.style.color = '#000';
                    }
                    chip.style.fontWeight = '600';
                    chip.textContent = tagText;
                } else {
                    // In partial mode, highlight the matching substrings
                    // Sort by length descending to match longer terms first
                    const sortedTerms = matchingSearchTerms
                        .map(t => t.toLowerCase())
                        .sort((a, b) => b.length - a.length);

                    // Build a regex to find all occurrences of matching terms
                    const escapedTerms = sortedTerms.map(term =>
                        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    );
                    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

                    // Replace matches with highlighted spans
                    const highlightedHTML = tagText.replace(regex, '<mark style="background-color: #ffd700; color: #000; font-weight: 600; padding: 0;">$1</mark>');
                    chip.innerHTML = highlightedHTML;
                }
            } else {
                chip.textContent = tagText;
            }

            // Only add remove button for non-pattern tags
            if (!isPatternTag) {
                // Add red remove "×" to request confirmation before deletion
                const removeBtn = document.createElement('span');
                removeBtn.className = 'lightbox-tag-remove';
                removeBtn.textContent = '×';
                removeBtn.title = 'Remove this tag from the image';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Check if locked - tag removal should still work, but show message if locked
                    if (lightboxLocked) {
                        showLightboxToast('Fields are locked. Click the lock icon to unlock.');
                        return;
                    }
                    handleRemoveTagFromImage(currentImage.id, tagText);
                });
                // Ensure remove button is always clickable (even when parent might be locked)
                removeBtn.style.pointerEvents = 'auto';
                removeBtn.style.cursor = 'pointer';
                chip.appendChild(removeBtn);
            }

                tagList.appendChild(chip);
            });
        }

        // Add input for adding new tags in lightbox
        const addWrap = document.createElement('div');
        addWrap.className = 'lightbox-tag-add';

        const addInput = document.createElement('input');
        addInput.type = 'text';
        addInput.placeholder = 'Add new tag (press Enter/Tab)';

        const commitAdd = async () => {
            if (lightboxLocked) {
                showLightboxToast('Fields are locked. Click the lock icon to unlock.');
                return;
            }
            const value = (addInput.value || '').trim();
            if (!value) return;
            const added = await handleAddTagToImage(currentImage.id, value);
            if (added) addInput.value = '';
        };

        addInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                commitAdd();
            }
        });

        addWrap.appendChild(addInput);
        lightboxTags.appendChild(tagList);
        lightboxTags.appendChild(addWrap);

        renderLightboxFreqFloating(currentImage.id);
    }

    // Remove a single tag from an image with confirmation (used in lightbox)
    function handleRemoveTagFromImage(imageId, tagText) {
        // Find image in currentLightboxImages (the currently displayed image)
        const image = currentLightboxImages.find(img => img.id === imageId);
        if (!image || !tagDeleteConfirmModal) return;
        pendingTagDelete = { imageId, tagText };
        tagDeleteName.textContent = tagText;
        tagDeleteConfirmModal.classList.remove('is-hidden');
    }

    async function confirmRemoveTagFromImage() {
        if (!pendingTagDelete) return;
        const { imageId, tagText } = pendingTagDelete;
        // Find image in currentLightboxImages (the currently displayed image)
        const image = currentLightboxImages.find(img => img.id === imageId);
        if (!image) {
            pendingTagDelete = null;
            tagDeleteConfirmModal.classList.add('is-hidden');
            return;
        }
        
        // Remove from pending adds if it was there
        pendingAddTags.delete(tagText);
        
        // Add to pending removes (don't save immediately, wait for save button)
        pendingRemoveTags.add(tagText);
        
        // Update local image tags for display
        const newTags = (image.tags || []).filter(t => t !== tagText);
        image.tags = newTags;
        
        // Also update in libraryImages for consistency
        const libImage = libraryImages.find(img => img.id === image.id);
        if (libImage) {
            libImage.tags = newTags;
        }
        
        // Also update in allImagesToDisplay for consistency
        const imageInDisplay = allImagesToDisplay.find(img => img.id === image.id);
        if (imageInDisplay) {
            imageInDisplay.tags = newTags;
        }
        
        lightboxDirty = true;
        displayLightboxTags(currentImageIndex);
        
        // Show save button if unlocked
        if (lightboxSaveBtn && !lightboxLocked) {
            lightboxSaveBtn.classList.remove('is-hidden');
        }
        
        pendingTagDelete = null;
        tagDeleteConfirmModal.classList.add('is-hidden');
    }

    async function handleAddTagToImage(imageId, tagText) {
        // Find image in currentLightboxImages (the currently displayed image)
        const image = currentLightboxImages.find(img => img.id === imageId);
        if (!image) return;
        const cleaned = tagText.trim();
        if (!cleaned) return;
        // Prevent duplicates against existing tags + pending adds (case-insensitive)
        const exists = [...(image.tags || []), ...pendingAddTags].some(t => t.toLowerCase() === cleaned.toLowerCase());
        if (exists) {
            showLightboxToast('Tag already added');
            return false;
        }
        pendingAddTags.add(cleaned);
        lightboxDirty = true;
        displayLightboxTags(currentImageIndex);
        renderLightboxFreqFloating(imageId);
        return true;
    }

    async function saveLightboxTagChanges(imageId, { closeAfterSave = false } = {}) {
        const image = libraryImages.find(img => img.id === imageId);
        if (!image) return;
        if (pendingAddTags.size === 0) {
            // No new tags, but if something changed (e.g., removals) and user clicked Save,
            // just close when requested instead of saying "Nothing to save".
            if (closeAfterSave && lightboxDirty) {
                lightboxDirty = false;
                hideModal();
            } else if (!lightboxDirty) {
                showLightboxToast('Nothing to save');
            }
            return;
        }
        const newTags = [...new Set([...(image.tags || []), ...pendingAddTags])];
        try {
            await updateImageTags(imageId, newTags);
            image.tags = newTags;
            // Increment feelings usage for subjective tags (no prefix)
            const feelings = [...pendingAddTags].filter(tag => !tag.includes(':'));
            if (feelings.length > 0) {
                await persistFeelingsUsage(feelings);
                await fetchSubjFrequencies();
            }
            pendingAddTags.clear();
            pendingRemoveTags.clear();
            pendingPatternChange = null;
            lightboxDirty = false;
            displayLightboxTags(currentImageIndex);
            renderLightboxFreqFloating(imageId);
            showLightboxToast('Tags saved');
            if (closeAfterSave) {
                hideModal();
            }
        } catch (err) {
            console.error('Failed to save tags:', err);
            alert('Failed to save tags. Please try again.');
        }
    }

    // Save all lightbox changes (metadata and tags)
    async function saveAllLightboxChanges() {
        if (currentImageIndex < 0 || currentImageIndex >= currentLightboxImages.length) {
            showLightboxToast('No image selected');
            return;
        }

        // Get the currently displayed image
        const image = currentLightboxImages[currentImageIndex];
        if (!image || !image.id) {
            showLightboxToast('Image not found');
            return;
        }

        // Simple logic: just add pending tags and pattern to the current image
        if (pendingAddTags.size === 0 && pendingRemoveTags.size === 0 && !pendingPatternChange) {
            showLightboxToast('Nothing to save');
            return;
        }

        try {
            // Get current tags
            let currentTags = Array.isArray(image.tags) ? [...image.tags] : [];
            
            // Apply pending pattern change first (remove old pattern, add new one)
            if (pendingPatternChange) {
                currentTags = currentTags.filter(tag => !tag.toLowerCase().startsWith('pattern:'));
                currentTags.push(`pattern:${pendingPatternChange}`);
            }
            
            // Apply pending removals
            currentTags = currentTags.filter(tag => !pendingRemoveTags.has(tag));
            
            // Add pending additions
            const newTags = [...new Set([...currentTags, ...pendingAddTags])];
            
            // Save tags to the image
            await updateImageTags(image.id, newTags);
            image.tags = newTags;
            
            // Update the image in libraryImages if it exists there
            const libImage = libraryImages.find(img => img.id === image.id);
            if (libImage) {
                libImage.tags = newTags;
            }
            
            // Update the image in allImagesToDisplay if it exists there
            const displayImage = allImagesToDisplay.find(img => img.id === image.id);
            if (displayImage) {
                displayImage.tags = newTags;
            }

            // Increment feelings usage for subjective tags (no prefix)
            const newSubjectiveTags = [...pendingAddTags].filter(tag => !tag.includes(':'));
            if (newSubjectiveTags.length > 0) {
                await persistFeelingsUsage(newSubjectiveTags);
                await fetchSubjFrequencies();
            }

            // Update feelings frequency for removed subjective tags
            const removedSubjectiveTags = Array.from(pendingRemoveTags).filter(tag => !isObjectiveTag(tag));
            if (removedSubjectiveTags.length > 0) {
                await persistFeelingsUsageDecrement(removedSubjectiveTags);
                await fetchSubjFrequencies();
            }

            pendingAddTags.clear();
            pendingRemoveTags.clear();
            pendingPatternChange = null;
            lightboxDirty = false;
            
            // Refresh display
            displayLightboxTags(currentImageIndex);
            displayLightboxMetadata(currentImageIndex);
            // Re-render frequency list with updated tags
            renderLightboxFreqFloating(image.id);
            
            // Hide save button and lock fields after save
            if (lightboxSaveBtn) {
                lightboxSaveBtn.classList.add('is-hidden');
            }
            lockLightboxFields(); // This will change lock icon to locked state
            
            showLightboxToast('Tags saved');
        } catch (err) {
            console.error('Failed to save changes:', err);
            const errorMessage = err.message || err.toString() || 'Unknown error';
            alert(`Failed to save changes: ${errorMessage}`);
        }
    }

    function renderLightboxFreqFloating(imageId) {
        // Prefer the preview overlay if it's visible; otherwise use the lightbox modal
        const overlay = (imagePreviewOverlay && imagePreviewOverlay.classList.contains('show'))
            ? imagePreviewOverlay
            : document.getElementById('lightbox-modal');
        if (!overlay) return;
        // remove existing
        const existing = document.getElementById('lightbox-freq-floating');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'lightbox-freq-floating';
        panel.className = 'lightbox-freq-floating';

        const header = document.createElement('h4');
        const headerText = document.createElement('span');
        headerText.textContent = 'Frequently used';
        header.appendChild(headerText);
        
        const sortBtn = document.createElement('button');
        sortBtn.className = 'button is-small';
        sortBtn.type = 'button';
        sortBtn.textContent = lightboxFreqSortMode === 'alphabetical' ? 'Freq' : 'A-Z';
        sortBtn.title = lightboxFreqSortMode === 'alphabetical' ? 'Sort by Frequency' : 'Sort A-Z';
        sortBtn.addEventListener('click', () => {
            lightboxFreqSortMode = lightboxFreqSortMode === 'frequency' ? 'alphabetical' : 'frequency';
            renderLightboxFreqFloating(imageId); // Re-render with new sort mode
        });
        header.appendChild(sortBtn);
        panel.appendChild(header);

        const list = document.createElement('div');
        list.className = 'lightbox-freq-list';

        const freqItems = Object.entries(subjFreqMap)
            .map(([label, count]) => ({ label, count }));
        
        if (lightboxFreqSortMode === 'alphabetical') {
            freqItems.sort((a, b) => a.label.localeCompare(b.label));
        } else {
            // Default: sort by count desc, then label asc
            freqItems.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        }

        if (freqItems.length === 0) {
            const empty = document.createElement('div');
            empty.style.color = '#ccc';
            empty.textContent = 'No frequent tags yet';
            list.appendChild(empty);
        } else {
            // Determine current tags for disable state
            const image = libraryImages.find(img => img.id === imageId);
            if (!image) {
                console.warn('Image not found for frequency rendering:', imageId);
                return;
            }
            
            // Get all tags (including pending) and filter to only subjective tags (no colon) for comparison
            // Normalize tags: trim whitespace and convert to lowercase for comparison
            const normalizeTag = (tag) => String(tag).trim().toLowerCase();
            
            // Get all tags from image and pending tags
            const imageTags = Array.isArray(image.tags) ? image.tags : [];
            const pendingTagsArray = Array.from(pendingAddTags);
            const allTags = [...imageTags, ...pendingTagsArray];
            
            // Filter to only subjective tags (no colon) and normalize
            const subjectiveTags = allTags
                .map(tag => String(tag).trim())
                .filter(tag => {
                    const trimmed = tag.trim();
                    return trimmed.length > 0 && !trimmed.includes(':');
                });
            
            const existingTags = new Set(subjectiveTags.map(normalizeTag));
            
            freqItems.forEach(({ label, count }) => {
                const row = document.createElement('div');
                row.className = 'lightbox-freq-item';
                const nameSpan = document.createElement('span');
                nameSpan.textContent = label;
                const countSpan = document.createElement('span');
                countSpan.textContent = `×${count}`;
                row.appendChild(nameSpan);
                row.appendChild(countSpan);
                
                // Check if this frequency tag is already in the image's subjective tags
                const labelNormalized = normalizeTag(label);
                const isUsed = existingTags.has(labelNormalized);
                
                // Always disable if tag is already in image (regardless of lock state)
                if (isUsed) {
                    row.classList.add('disabled');
                    // Always prevent interaction when disabled (regardless of lock state)
                    row.style.pointerEvents = 'none';
                } else {
                    // Make sure non-disabled items don't have pointerEvents set to none
                    row.style.pointerEvents = '';
                }
                
                row.addEventListener('click', (e) => {
                    // Always prevent click if disabled (regardless of lock state)
                    if (row.classList.contains('disabled')) {
                        e.preventDefault();
                        e.stopPropagation();
                        showLightboxToast('Tag already added');
                        return false;
                    }
                    
                    // Check lock state only for non-disabled items
                    if (lightboxLocked) {
                        showLightboxToast('Fields are locked. Click the lock icon to unlock.');
                        return false;
                    }
                    
                    handleAddTagToImage(imageId, label);
                    return false;
                });
                list.appendChild(row);
            });
        }

        panel.appendChild(list);
        overlay.appendChild(panel);
    }

    let lightboxToastTimeout = null;
    function showLightboxToast(message) {
        if (!message) return;
        const existing = document.getElementById('lightbox-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'lightbox-toast';
        toast.className = 'lightbox-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        if (lightboxToastTimeout) clearTimeout(lightboxToastTimeout);
        lightboxToastTimeout = setTimeout(() => {
            toast.remove();
        }, 1800);
    }

    // --- Selection and Project Management Functions ---

    function toggleImageSelection(imageId, cardElement) {
        // Allow selection/deselection in both library and pool view

        const isSelected = selectedImages.includes(imageId);
        const isTagSelected = tagSelectedImages.includes(imageId);

        if (isSelected) {
            // Deselect - allow full deselection for both manual and tag-selected images
            selectedImages = selectedImages.filter(id => id !== imageId);
            cardElement.classList.remove('selected', 'manual-selection', 'tag-selection');

            // Remove from selection order tracking and source tracking
            delete imageSelectionOrder[imageId];
            delete imageSelectionSource[imageId];

            // Don't automatically re-select tag images - allow them to be fully deselected
        } else {
            // Select
            selectedImages.push(imageId);
            cardElement.classList.add('selected');

            // Remove pool-deselected class to restore red borders
            cardElement.classList.remove('pool-deselected');

            // Track selection timestamp for ordering (latest first in pool view)
            imageSelectionOrder[imageId] = Date.now();

            // Track as manual selection
            imageSelectionSource[imageId] = 'manual';

            // Update CSS class based on selection type
            cardElement.classList.remove('manual-selection', 'tag-selection');
            if (isTagSelected) {
                cardElement.classList.add('tag-selection');
            } else {
                cardElement.classList.add('manual-selection');
            }
        }

        // Note: updateSelectionState is async but we don't await here to avoid blocking UI
        updateSelectionState();
    }

    // Helper function to calculate correct selection count considering AND/OR mode
    async function calculateSelectionCount() {
        const currentSearchTags = getActiveSearchTagTexts();
        const searchMode = tagSearchMode;
        
        console.log('[FRONTEND] calculateSelectionCount - mode:', searchMode, 'tags:', currentSearchTags);
        console.log('[FRONTEND] selectedImages:', selectedImages, 'tagSelectedImages:', tagSelectedImages);
        
        // When tags are active, verify selections match the current mode
        if (currentSearchTags.length > 0) {
            try {
                // Fetch all images to verify which images match the current mode
                const sessionToken = localStorage.getItem('sessionToken');
                const headers = {};
                if (sessionToken) {
                    headers['Authorization'] = `Bearer ${sessionToken}`;
                }
                const allImagesResponse = await fetch(`${API_URL}/images`, { headers });
                const allImages = allImagesResponse.ok ? await allImagesResponse.json() : [];
                
                const currentTagsLower = currentSearchTags.map(t => t.toLowerCase());
                let validManualSelections;
                let validTagSelections;
                
                if (searchMode === 'AND') {
                    // AND mode: filter both manual and tag-selected images to only include those matching ALL tags
                    validManualSelections = selectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        if (!img) return false;
                        const imageTags = (img.tags || []).map(t => t.toLowerCase());
                        if (exactWordMode) {
                            // Exact word mode: each search tag must be present exactly
                            return currentTagsLower.every(tag => imageTags.includes(tag));
                        } else {
                            // Partial mode: each search tag must match at least one image tag as a substring
                            return currentTagsLower.every(tag =>
                                imageTags.some(imageTag => imageTag.includes(tag))
                            );
                        }
                    });
                    
                    // Also verify tag-selected images match ALL tags (they should from API, but verify to be safe)
                    validTagSelections = tagSelectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        if (!img) return false;
                        const imageTags = (img.tags || []).map(t => t.toLowerCase());
                        if (exactWordMode) {
                            return currentTagsLower.every(tag => imageTags.includes(tag));
                        } else {
                            return currentTagsLower.every(tag =>
                                imageTags.some(imageTag => imageTag.includes(tag))
                            );
                        }
                    });
                    
                    console.log('[FRONTEND] AND mode - validManualSelections:', validManualSelections, 'validTagSelections:', validTagSelections);
                } else {
                    // OR mode: all manually selected images count (no filtering by tags)
                    // But we still verify the images exist
                    validManualSelections = selectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        return img !== undefined;
                    });
                    // OR mode: verify tag-selected images match at least one search tag (respecting exactWordMode)
                    validTagSelections = tagSelectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        if (!img) return false;
                        const imageTags = (img.tags || []).map(t => t.toLowerCase());
                        if (exactWordMode) {
                            // Exact word mode: image must have at least one tag that exactly matches a search tag
                            return currentTagsLower.some(tag => imageTags.includes(tag));
                        } else {
                            // Partial mode: image must have at least one tag that contains a search tag as substring
                            return currentTagsLower.some(tag =>
                                imageTags.some(imageTag => imageTag.includes(tag))
                            );
                        }
                    });
                    
                    console.log('[FRONTEND] OR mode - validManualSelections:', validManualSelections, 'validTagSelections:', validTagSelections);
                }
                
                // Combine valid manual selections with valid tag-selected images
                const totalCount = [...new Set([...validManualSelections, ...validTagSelections])].length;
                console.log('[FRONTEND] calculateSelectionCount result:', totalCount);
                return totalCount;
            } catch (error) {
                console.error('Error fetching images for selection count:', error);
                // Fallback to simple count if fetch fails
                const fallbackCount = [...new Set([...selectedImages, ...tagSelectedImages])].length;
                console.log('[FRONTEND] calculateSelectionCount fallback result:', fallbackCount);
                return fallbackCount;
            }
        } else {
            // No active tags: combine all selections (no filtering needed)
            const noTagCount = [...new Set([...selectedImages, ...tagSelectedImages])].length;
            console.log('[FRONTEND] calculateSelectionCount (no tags) result:', noTagCount);
            return noTagCount;
        }
    }

    async function updateSelectionState() {
        // Calculate total selections: manual selections + tag-based selections (considering current mode)
        // In library view, tagSelectedImages already represents the backend-matching set.
        // calculateSelectionCount() does extra filtering which can undercount (especially in exact/pattern modes).
        const totalSelections = (!isPoolView && getActiveSearchTagTexts().length > 0)
            ? [...new Set([...selectedImages, ...tagSelectedImages])].length
            : await calculateSelectionCount();
        
        // Update selection count display (only if selectionCount element exists)
        if (selectionCount) {
            if (totalSelections === 0) {
                selectionCount.textContent = 'No image selected';
            } else {
                selectionCount.textContent = `${totalSelections} selected`;
            }
        }
        
        addToProjectBtn.disabled = totalSelections === 0;
        updateButtonVisibility();
        updateClearButtonState(); // Update Clear All button state when selections change
    }

    function isShowingSelectionPool() {
        // We now treat Selection Pool as an explicit view only.
        // Tag searches stay in the main library until the user clicks "View Selection Pool".
        return isPoolView;
    }



    function updateButtonVisibility() {
        console.log('updateButtonVisibility called, isPoolView:', isPoolView, 'selectedImages.length:', selectedImages.length);
        console.log('searchTags.length:', searchTags.length);

        const currentSearchTags = getActiveSearchTagTexts();

        // In pool view, consider both manual and tag selections.
        // In library view, only consider tag selections when there are active search tags.
        const hasSelections = isPoolView
            ? (selectedImages.length > 0 || tagSelectedImages.length > 0)
            : (selectedImages.length > 0 || (currentSearchTags.length > 0 && tagSelectedImages.length > 0));

        console.log('=== BUTTON VISIBILITY DEBUG ===');
        console.log('isPoolView:', isPoolView);
        console.log('selectedImages.length:', selectedImages.length);
        console.log('tagSelectedImages.length:', tagSelectedImages.length);
        console.log('hasSelections calculated:', hasSelections);
        const showingSelectionPool = isShowingSelectionPool();

        // Check if we're actually showing Selection Pool (either explicit pool view OR search results with selections)
        const actuallyShowingSelectionPool = isPoolView || showingSelectionPool;

        if (isPoolView) {
            // Pool view: Show all buttons (Select All, Deselect All, Back to Library, Add to Project)
            viewPoolBtn.classList.add('is-hidden');
            viewPoolBtn.disabled = true;

            backToLibraryBtn.classList.remove('is-hidden');
            backToLibraryBtn.disabled = false;

            // Keep Select All and Deselect All visible in pool view
            selectAllBtn.classList.remove('is-hidden');
            selectAllBtn.disabled = false;

            deselectAllBtn.classList.remove('is-hidden');
            deselectAllBtn.disabled = !hasSelections; // Dimmed when no selections

            // Show Add to Project button in pool view
            addToProjectBtn.classList.remove('is-hidden');
            addToProjectBtn.disabled = !hasSelections; // Dimmed when no selections

            console.log('Pool view - Add to Project button:');
            console.log('  - hidden:', addToProjectBtn.classList.contains('is-hidden'));
            console.log('  - disabled:', addToProjectBtn.disabled);
            console.log('  - hasSelections:', hasSelections);

            console.log('Set buttons for pool view - showing all buttons');
        } else {
            // Library view: Show library controls, hide back button
            viewPoolBtn.classList.remove('is-hidden');
            // Always behave as "View Selection Pool" in library view
            viewPoolBtn.textContent = 'View Selection Pool';
            viewPoolBtn.disabled = !hasSelections; // Dimmed when no selections

            backToLibraryBtn.classList.add('is-hidden');
            backToLibraryBtn.disabled = true;

            selectAllBtn.classList.remove('is-hidden');
            selectAllBtn.disabled = false; // Always enabled in library view

            deselectAllBtn.classList.remove('is-hidden');
            deselectAllBtn.disabled = !hasSelections; // Dimmed when no selections

            // Show Add to Project button in library view when there are selections
            if (hasSelections) {
                addToProjectBtn.classList.remove('is-hidden');
                addToProjectBtn.disabled = false;
                console.log('Library view - Add to Project button SHOWN (has selections)');
            } else {
                addToProjectBtn.classList.add('is-hidden');
                addToProjectBtn.disabled = true;
                console.log('Library view - Add to Project button HIDDEN (no selections)');
            }

            console.log('Set buttons for library view, showingSelectionPool:', showingSelectionPool);
        }

        // Update Tag button: Show ONLY in Selection Pool view when there are selections
        if (actuallyShowingSelectionPool && hasSelections) {
            updateTagBtn.classList.remove('is-hidden');
            updateTagBtn.disabled = false;
        } else {
            updateTagBtn.classList.add('is-hidden');
            updateTagBtn.disabled = true;
        }

        // Delete Image button: Show when actually displaying Selection Pool and has selections
        if (actuallyShowingSelectionPool && hasSelections) {
            deleteImageBtn.classList.remove('is-hidden');
            deleteImageBtn.disabled = false;
        } else {
            deleteImageBtn.classList.add('is-hidden');
            deleteImageBtn.disabled = true;
        }

        // Log final button states for debugging
        console.log('Final button states:');
        console.log('viewPoolBtn - hidden:', viewPoolBtn.classList.contains('is-hidden'), 'disabled:', viewPoolBtn.disabled);
        console.log('backToLibraryBtn - hidden:', backToLibraryBtn.classList.contains('is-hidden'), 'disabled:', backToLibraryBtn.disabled);
        console.log('selectAllBtn - hidden:', selectAllBtn.classList.contains('is-hidden'), 'disabled:', selectAllBtn.disabled);
        console.log('deselectAllBtn - hidden:', deselectAllBtn.classList.contains('is-hidden'), 'disabled:', deselectAllBtn.disabled);
        console.log('addToProjectBtn - hidden:', addToProjectBtn.classList.contains('is-hidden'), 'disabled:', addToProjectBtn.disabled);
        console.log('updateTagBtn - hidden:', updateTagBtn.classList.contains('is-hidden'), 'disabled:', updateTagBtn.disabled);
    }

    function selectAllImages() {
        const cards = document.querySelectorAll('.library-card');
        selectedImages = [];
        const currentTimestamp = Date.now();

        cards.forEach(card => {
            const imageId = parseInt(card.dataset.imageId);
            selectedImages.push(imageId);

            // Track selection timestamp for ordering
            imageSelectionOrder[imageId] = currentTimestamp;

            // Track as manual selection (select all is considered manual)
            imageSelectionSource[imageId] = 'manual';

            // Add selected class
            card.classList.add('selected');

            // Remove pool-deselected class to restore red borders
            card.classList.remove('pool-deselected');

            // Determine and apply the correct selection type class
            const isTagSelected = tagSelectedImages.includes(imageId);
            card.classList.remove('manual-selection', 'tag-selection');

            if (isTagSelected) {
                card.classList.add('tag-selection');
            } else {
                card.classList.add('manual-selection');
            }
        });

        updateSelectionState();
    }

    function deselectAllImages() {
        // Safety check: Don't execute if no selections
        if (selectedImages.length === 0) {
            console.warn('deselectAllImages called but no images are selected');
            return;
        }

        const cards = document.querySelectorAll('.library-card');

        // Clear selection timestamps for all deselected images
        selectedImages.forEach(imageId => {
            delete imageSelectionOrder[imageId];
        });

        selectedImages = [];

        cards.forEach(card => {
            if (isPoolView) {
                // In Selection Pool, remove red borders but keep icons
                card.classList.remove('selected');
                card.classList.add('pool-deselected');
            } else {
                // In Library view, remove all selection-related classes completely
                card.classList.remove('selected');
                card.classList.remove('manual-selection');
                card.classList.remove('tag-selection');
                card.classList.remove('pool-deselected');
            }
        });

        updateSelectionState();
    }



    function handleViewPoolClick() {
        // Always explicitly switch to Selection Pool when this button is clicked.
        // Tag searches alone no longer auto-switch the view.
        viewSelectionPool();
    }

    async function viewSelectionPool() {
        console.log('=== viewSelectionPool START ===');
        console.log('selectedImages:', selectedImages);
        console.log('selectedImages.length:', selectedImages.length);
        console.log('tagSelectedImages:', tagSelectedImages);
        console.log('tagSelectedImages.length:', tagSelectedImages.length);

        const totalSelections = (selectedImages.length || 0) + (tagSelectedImages.length || 0);
        if (totalSelections === 0) {
            alert('No images selected. Please select some images first.');
            return;
        }

        console.log('Setting isPoolView to true');
        isPoolView = true;

        // Update header to show Selection Pool
        updateLibraryTitle(true);

        // Ensure button text reflects current mode (preserve AND/OR state)
        console.log('Before updateTagModeButtonText - tagSearchMode:', tagSearchMode);
        updateTagModeButtonText();
        console.log('After updateTagModeButtonText - button text:', tagModeToggleBtn.textContent, 'tagSearchMode:', tagSearchMode);

        // Use the main display function which now handles pool view
        await displayLibraryImages();
        
        // Ensure button text is still correct after displayLibraryImages (in case something reset it)
        console.log('After displayLibraryImages - button text:', tagModeToggleBtn.textContent, 'tagSearchMode:', tagSearchMode);
        updateTagModeButtonText();
        console.log('After final updateTagModeButtonText - button text:', tagModeToggleBtn.textContent);
        console.log('=== viewSelectionPool END ===');
    }

    function showFullLibrary() {
        console.log('=== showFullLibrary START ===');
        console.log('Showing full library while preserving green tag chips for user reference');

        // Clear search tags to show ALL images (provides visual feedback)
        searchTags = [];

        // Chips are visible for reference only in this mode
        chipsReferenceOnly = true;

        // DON'T clear tagSelectedImages - preserve tag selection status for overlays
        // DON'T clear chips and input - keep them visible for user reference

        // Ensure we're in library view
        isPoolView = false;

        // Update header back to normal library view
        updateLibraryTitle(false);

        // Refresh to show full library (all images)
        displayLibraryImages();

        console.log('=== showFullLibrary END ===');
    }

    function backToFullLibrary() {
        console.log('=== backToFullLibrary START ===');
        console.log('Returning to full library while preserving green tag chips for user reference');
        console.log('backToFullLibrary called - preserving tagSelectedImages:', tagSelectedImages);

        // Clear search tags to show ALL images (provides visual feedback)
        searchTags = [];
        searchPatterns = []; // Clear search patterns

        // Chips are visible for reference only in this mode
        chipsReferenceOnly = true;

        // DON'T clear tagSelectedImages - preserve tag selection history for overlays
        // DON'T clear chips and input - keep them visible for user reference

        // Ensure we're in library view
        isPoolView = false;

        // Update header back to normal library view
        updateLibraryTitle(false);

        // Refresh to show full library (all images)
        displayLibraryImages();

        console.log('=== backToFullLibrary END ===');
    }

    function backToLibrary() {
        try {
            console.log('=== backToLibrary START ===');
            console.log('selectedImages before:', selectedImages);
            console.log('searchTags before:', searchTags);
            console.log('tagSelectedImages before:', tagSelectedImages);
            console.log('isPoolView before:', isPoolView);

            // Safety check: Don't execute if button should be disabled
            if (backToLibraryBtn.disabled) {
                console.error('backToLibrary called but button is disabled! This should not happen.');
                console.log('Button state - hidden:', backToLibraryBtn.classList.contains('is-hidden'), 'disabled:', backToLibraryBtn.disabled);
                return;
            }

            // Check if we're actually in pool view
            if (!isPoolView) {
                console.warn('backToLibrary called but isPoolView is already false!');
                console.log('Current button states:');
                console.log('viewPoolBtn hidden:', viewPoolBtn.classList.contains('is-hidden'), 'disabled:', viewPoolBtn.disabled);
                console.log('backToLibraryBtn hidden:', backToLibraryBtn.classList.contains('is-hidden'), 'disabled:', backToLibraryBtn.disabled);
                // Force correct button state
                updateButtonVisibility();
                return;
            }

            isPoolView = false;
            forceLibraryView = true; // Prevent auto-switching back to pool view
            console.log('Set isPoolView to false and forceLibraryView to true');
            console.log('Preserving tagSearchMode:', tagSearchMode, 'when going back to Library');
            
            // Ensure button text reflects current mode (preserve AND/OR state)
            updateTagModeButtonText();
            
            console.log('About to update title to Library view');

            // Update header back to normal library view FIRST
            updateLibraryTitle(false);
            console.log('Title updated to Library view');

            // PRESERVE search tags and selections when going back to library
            // Users should see all their search tags still visible and functional
            if (searchTags.length > 0) {
                console.log('Preserving search tags and all selections in library view');

                // Keep tagSelectedImages as they are for proper display in library view
                console.log('Search tags and selections preserved:', selectedImages.length + tagSelectedImages.length, 'tags:', searchTags.length);
            }

            // Update button visibility BEFORE refreshing view
            updateButtonVisibility();

            // Refresh library view (will show all images with preserved selections)
            console.log('Calling displayLibraryImages...');
            displayLibraryImages().then(() => {
                console.log('displayLibraryImages completed successfully');
                console.log('isPoolView after:', isPoolView);
                console.log('tagSelectedImages after:', tagSelectedImages);
                
                // Ensure search input is enabled when back in library view
                const searchInput = document.getElementById('library-search-input');
                const clearAllBtn = document.getElementById('clear-all-tags');
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.style.opacity = '1';
                    searchInput.style.cursor = 'text';
                }
                if (clearAllBtn) {
                    clearAllBtn.disabled = false;
                    clearAllBtn.style.opacity = '1';
                    clearAllBtn.style.cursor = 'pointer';
                }
                
                console.log('=== backToLibrary END ===');
            }).catch(error => {
                console.error('Error in displayLibraryImages:', error);
                alert('Error returning to library. Please refresh the page.');
            });

        } catch (error) {
            console.error('Error in backToLibrary:', error);
            alert('Error returning to library. Please refresh the page.');
        }
    }

    async function showProjectNameModal() {
        console.log('[FRONTEND] showProjectNameModal called');
        console.log('[FRONTEND] Selected images before modal:', selectedImages);
        console.log('[FRONTEND] Tag-selected images before modal:', tagSelectedImages);

        // Use calculateSelectionCount to get accurate count considering AND/OR mode
        const totalSelections = await calculateSelectionCount();
        console.log('[FRONTEND] Total selections calculated:', totalSelections);
        
        if (totalSelections === 0) {
            console.warn('[FRONTEND] showProjectNameModal called but no images are selected');
            alert('Please select at least one image before creating a project.');
            return;
        }

        console.log(`[FRONTEND] Total selections for project: ${totalSelections} (${selectedImages.length} manual + ${tagSelectedImages.length} tag-based)`);

        projectNameInput.value = '';
        projectNameModal.classList.remove('is-hidden');
        projectNameInput.focus();
    }

    function hideProjectNameModal() {
        projectNameModal.classList.add('is-hidden');
        projectNameInput.value = '';
    }

    function showProjectCreatedModal(projectName, imageCount) {
        projectSuccessMessage.textContent = `Project "${projectName}" created with ${imageCount} images! What would you like to do next?`;
        projectCreatedModal.classList.remove('is-hidden');
    }

    function hideProjectCreatedModal() {
        projectCreatedModal.classList.add('is-hidden');
        lastCreatedProject = null;
    }

    function showProjectDetailModal(project) {
        console.log('=== SHOWPROJECTDETAILMODAL START ===');
        console.log('Opening project detail modal for:', project);
        console.log('Project selection_breakdown:', project.selection_breakdown);

        // Store project ID for reference
        projectDetailModal.dataset.projectId = project.id;

        // Update header information - only show project name
        projectDetailName.textContent = `📁 ${project.name}`;
        
        // Hide Created date, Total Images breakdown, and Created by per request
        if (projectDetailDate) {
            projectDetailDate.style.display = 'none';
        }
        if (projectDetailCount) {
            projectDetailCount.style.display = 'none';
        }
        if (projectDetailOwner) {
            projectDetailOwner.style.display = 'none';
        }

        // Populate tags text with search tags (1st level tags) only
        console.log('projectDetailTagsText element:', projectDetailTagsText);
        if (projectDetailTagsText) {
            // Get search tags from selection_breakdown.searchTags (these are the user search tags)
            let searchTagsList = [];
            console.log('Project selection_breakdown:', JSON.stringify(project.selection_breakdown, null, 2));
            
            if (project.selection_breakdown) {
                if (project.selection_breakdown.searchTags && Array.isArray(project.selection_breakdown.searchTags) && project.selection_breakdown.searchTags.length > 0) {
                    // Use the stored search tags array (all tags the user searched for)
                    searchTagsList = project.selection_breakdown.searchTags;
                    console.log('✓ Using stored searchTags:', searchTagsList);
                } else if (project.selection_breakdown.tagCounts && typeof project.selection_breakdown.tagCounts === 'object') {
                    // Fallback: use keys from tagCounts for older projects without searchTags stored
                    const tagCountsKeys = Object.keys(project.selection_breakdown.tagCounts);
                    if (tagCountsKeys.length > 0) {
                        searchTagsList = tagCountsKeys;
                        console.log('✓ Using tagCounts keys as fallback:', searchTagsList);
                    }
                }
            } else {
                console.log('⚠ No selection_breakdown found in project');
            }
            
            // If no search tags found, collect all subjective tags from project images
            if (searchTagsList.length === 0 && project.image_ids && project.image_ids.length > 0) {
                searchTagsList = getProjectSubjectiveTags(project.image_ids);
                console.log('✓ Using subjective tags from project images as fallback:', searchTagsList);
            }
            
            // Get search mode from selection_breakdown, default to 'OR' if not available
            let searchMode = 'OR';
            if (project.selection_breakdown && project.selection_breakdown.searchMode) {
                searchMode = project.selection_breakdown.searchMode;
            }
            
            // Format tags with operator (OR/AND)
            let tagsValue = '';
            if (searchTagsList.length > 0) {
                const operator = searchMode.toUpperCase();
                tagsValue = searchTagsList.join(` ${operator} `);
            }
            
            projectDetailTagsText.textContent = tagsValue || '';
            console.log('✓ Project detail tags text set to:', tagsValue, '(mode:', searchMode, ')');
        } else {
            console.error('✗ projectDetailTagsText element not found!');
        }

        // Load project images
        loadProjectImages(project.image_ids);

        // Show modal
        projectDetailModal.classList.remove('is-hidden');
    }

    function hideProjectDetailModal() {
        projectDetailModal.classList.add('is-hidden');
        projectDetailGrid.innerHTML = '';
        delete projectDetailModal.dataset.projectId;
    }

    function getProjectTags(imageIds) {
        const allTags = new Set();
        imageIds.forEach(imageId => {
            const image = libraryImages.find(img => img.id === imageId);
            if (image && image.tags) {
                image.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags);
    }

    // Get all subjective tags from project images (exclude objective metadata)
    function getProjectSubjectiveTags(imageIds) {
        const allSubjectiveTags = new Set();
        imageIds.forEach(imageId => {
            const image = libraryImages.find(img => img.id === imageId);
            if (image && image.tags) {
                image.tags.forEach(tag => {
                    if (!isObjectiveTag(tag)) {
                        allSubjectiveTags.add(tag);
                    }
                });
            }
        });
        return Array.from(allSubjectiveTags).sort();
    }

    function generateSelectionBreakdown() {
        // Get current search tags and mode
        const currentSearchTags = getActiveSearchTagTexts();
        const searchMode = tagSearchMode;

        console.log('generateSelectionBreakdown - currentSearchTags:', currentSearchTags);
        console.log('generateSelectionBreakdown - searchMode:', searchMode);
        console.log('generateSelectionBreakdown - selectedImages:', selectedImages);
        console.log('generateSelectionBreakdown - imageSelectionSource:', imageSelectionSource);

        // Count images by how they were selected
        const tagCounts = {};
        let manuallySelectedCount = 0;

        selectedImages.forEach(imageId => {
            const selectionSource = imageSelectionSource[imageId];

            if (selectionSource === 'manual') {
                manuallySelectedCount++;
            } else if (selectionSource) {
                // This was selected by a search operation
                // The selectionSource contains the search tags used (comma-separated)
                const searchTagsUsed = selectionSource.split(',');

                // For breakdown, we want to show which specific search tag this image should be attributed to
                // Find which of the current search tags this image actually has
                const image = libraryImages.find(img => img.id === imageId);
                if (image && image.tags) {
                    // Find the first current search tag that this image has
                    const matchingTag = currentSearchTags.find(tag => image.tags.includes(tag));
                    if (matchingTag) {
                        tagCounts[matchingTag] = (tagCounts[matchingTag] || 0) + 1;
                    } else {
                        // Image was selected by search but doesn't match current tags (shouldn't happen)
                        manuallySelectedCount++;
                    }
                } else {
                    manuallySelectedCount++;
                }
            } else {
                // No selection source recorded, treat as manual
                manuallySelectedCount++;
            }
        });

        console.log('generateSelectionBreakdown - tagCounts:', tagCounts);
        console.log('generateSelectionBreakdown - manuallySelectedCount:', manuallySelectedCount);

        return {
            tagCounts,
            manuallySelectedCount,
            totalImages: selectedImages.length,
            searchTags: currentSearchTags, // Store the search tags used to create the project
            searchMode: searchMode // Store the search mode (OR/AND)
        };
    }

    function generateBreakdownFromProject(project) {
        // For existing projects without breakdown data, analyze the images
        const imageIds = project.image_ids || [];
        const tagCounts = {};
        let totalImages = imageIds.length;

        console.log('generateBreakdownFromProject - imageIds:', imageIds);
        console.log('generateBreakdownFromProject - libraryImages.length:', libraryImages.length);

        // Count images by tag
        imageIds.forEach(imageId => {
            const image = libraryImages.find(img => img.id === imageId);
            console.log(`Image ${imageId}:`, image ? `found with tags: ${image.tags}` : 'not found');
            if (image && image.tags) {
                image.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        console.log('generateBreakdownFromProject - tagCounts:', tagCounts);

        return {
            tagCounts,
            manuallySelectedCount: 0, // Can't determine for existing projects
            totalImages
        };
    }

    function formatSelectionBreakdown(breakdown, project = null) {
        console.log('formatSelectionBreakdown called with breakdown:', breakdown, 'project:', project);

        // If no breakdown provided, try to generate one from project data
        if (!breakdown && project) {
            console.log('No breakdown provided, generating from project...');
            breakdown = generateBreakdownFromProject(project);
        }

        if (!breakdown) {
            console.log('No breakdown available, using simple format');
            return `📊 Total Images: ${project?.image_ids?.length || 0}`;
        }

        console.log('Using breakdown:', breakdown);

        const tagBreakdowns = [];

        // Add tag counts
        Object.entries(breakdown.tagCounts || {}).forEach(([tag, count]) => {
            tagBreakdowns.push(`${tag} - ${count} image${count !== 1 ? 's' : ''}`);
        });

        // Add manually selected count (only if we have the data)
        if (breakdown.manuallySelectedCount > 0) {
            tagBreakdowns.push(`${breakdown.manuallySelectedCount} manually selected`);
        }

        // If no tag breakdowns but we have images, they must be manually selected (for existing projects)
        if (tagBreakdowns.length === 0 && breakdown.totalImages > 0 && !breakdown.tagCounts) {
            tagBreakdowns.push(`${breakdown.totalImages} manually selected`);
        }

        let result = `📊 Total Images: ${breakdown.totalImages}`;
        if (tagBreakdowns.length > 0) {
            result += ` (${tagBreakdowns.join(', ')})`;
        }

        console.log('Final formatted result:', result);
        return result;
    }

    async function loadProjectImages(imageIds) {
        projectDetailGrid.innerHTML = '';

        try {
            // Get all images from API
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            const response = await fetch(`${API_URL}/images`, {
                headers: headers
            });
            if (!response.ok) throw new Error('Failed to fetch images');
            const allImages = await response.json();

            // Filter to only project images
            const projectImages = allImages.filter(img => imageIds.includes(img.id));

            projectImages.forEach(image => {
                const card = document.createElement('div');
                card.className = 'project-image-card';

                const img = document.createElement('img');
                const imageSrc = `${API_URL}/${image.filepath.replace(/\\/g, '/')}`;
                img.alt = '';

                // Prepare tag overlay to show all tags for this image
                const allImageTags = image.tags || [];
                // Filter out objective metadata tags (width, length, book, page, row, column, type, material, remark, brand, color)
                const objectivePrefixes = ['width:', 'length:', 'book:', 'page:', 'row:', 'column:', 'type:', 'material:', 'remark:', 'pattern:', 'brand:', 'color:'];
                const subjectiveTags = allImageTags.filter(tag => {
                    const tagLower = tag.toLowerCase();
                    return !objectivePrefixes.some(prefix => tagLower.startsWith(prefix));
                });

                let tagOverlay = null;
                if (subjectiveTags.length > 0) {
                    tagOverlay = document.createElement('div');
                    tagOverlay.className = 'tag-overlay';
                    // Show all tags, comma-separated
                    tagOverlay.textContent = subjectiveTags.join(', ');
                }

                // Test image loading before displaying
                const testImg = new Image();
                testImg.onload = () => {
                    img.src = imageSrc;

                    // Add click handler for lightbox
                    img.addEventListener('click', () => {
                        // Open lightbox for this image
                        openProjectImageLightbox(image, projectImages);
                    });

                    card.appendChild(img);
                    // Append tag overlay if it exists
                    if (tagOverlay) {
                        card.appendChild(tagOverlay);
                    }
                };
                testImg.onerror = () => {
                    // Skip broken images in project view
                    console.warn(`Project image failed to load: ${imageSrc} (ID: ${image.id})`);
                    // Don't append the img to the card
                };
                testImg.src = imageSrc;

                // Create icons container
                const iconsContainer = document.createElement('div');
                iconsContainer.className = 'project-image-icons';

                // Determine selection type and add appropriate icons
                const isTagSelected = tagSelectedImages.includes(image.id);
                const isManualSelected = selectedImages.includes(image.id) && !isTagSelected;

                if (isTagSelected) {
                    const tagIcon = document.createElement('div');
                    tagIcon.className = 'project-image-icon';
                    tagIcon.textContent = '🏷️';
                    tagIcon.title = 'Selected by tags';
                    iconsContainer.appendChild(tagIcon);
                }

                if (isManualSelected) {
                    const handIcon = document.createElement('div');
                    handIcon.className = 'project-image-icon';
                    handIcon.textContent = '👆';
                    handIcon.title = 'Manually selected';
                    iconsContainer.appendChild(handIcon);
                }

                if (iconsContainer.children.length > 0) {
                    card.appendChild(iconsContainer);
                }

                projectDetailGrid.appendChild(card);
            });

        } catch (error) {
            console.error('Error loading project images:', error);
            projectDetailGrid.innerHTML = '<p>Error loading project images.</p>';
        }
    }

    function openProjectImageLightbox(image, projectImages) {
        // Set up lightbox for project images with proper src format
        const imageIndex = projectImages.findIndex(img => img.id === image.id);

        // Format project images for lightbox (add src property)
        const formattedImages = projectImages.map(img => ({
            ...img,
            src: `${API_URL}/${img.filepath.replace(/\\/g, '/')}`
        }));

        // Temporarily set for lightbox navigation
        libraryImages = formattedImages;
        
        // Mark as project view (read-only mode)
        isProjectViewLightbox = true;
        lightboxLocked = true;
        
        // Open lightbox
        openLibraryLightbox(imageIndex);
        
        // Hide lock button and ensure all fields stay locked (project view is read-only)
        setTimeout(() => {
            // Hide lock button - no editing allowed in project view
            if (lightboxLockBtn) {
                lightboxLockBtn.classList.add('is-hidden');
            }
            // Hide save button as well
            if (lightboxSaveBtn) {
                lightboxSaveBtn.classList.add('is-hidden');
            }
            // Lock all fields
            lockLightboxFields();
        }, 150);
    }

    function filterProjects(searchTerm) {
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            const projectTitle = card.querySelector('.project-title').textContent.toLowerCase();
            if (projectTitle.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Image Preview Overlay Functions
    function showImagePreviewOverlay(imageSrc, image) {
        // Set up regular library preview (no navigation)
        isSelectionPoolPreview = false;
        currentPreviewImages = [];
        currentPreviewIndex = 0;

        previewOverlayImg.src = imageSrc;
        previewOverlayImg.alt = image ? `Full size preview of image ${image.id}` : 'Full size preview';

        // Reset scroll position to top-left
        imagePreviewOverlay.scrollTop = 0;
        imagePreviewOverlay.scrollLeft = 0;

        imagePreviewOverlay.classList.add('show');

        // Hide navigation arrows for regular library view
        previewNavLeft.classList.add('hidden');
        previewNavRight.classList.add('hidden');

        // Prevent body scrolling when overlay is open (but allow overlay scrolling)
        document.body.style.overflow = 'hidden';

        // Add pan event listeners
        addPanEventListeners();

        if (image) {
            console.log('Regular image preview overlay opened for image:', image.id);
        } else {
            console.log('Image preview overlay opened for uploaded image');
        }
    }

    function hideImagePreviewOverlay() {
        imagePreviewOverlay.classList.remove('show');
        previewOverlayImg.src = '';

        // Restore body scrolling
        document.body.style.overflow = '';

        // Remove pan event listeners
        removePanEventListeners();

        // Reset Selection Pool preview state
        isSelectionPoolPreview = false;
        currentPreviewImages = [];
        currentPreviewIndex = 0;

        // Hide navigation arrows
        previewNavLeft.classList.add('hidden');
        previewNavRight.classList.add('hidden');

        // Hide real-size specific elements
        document.getElementById('preview-overlay-settings').classList.add('hidden');
        document.getElementById('preview-dimension-info').classList.add('hidden');
        previewOverlayImg.style.width = '';
        previewOverlayImg.style.height = '';
        previewOverlayImg.style.maxWidth = '';
        previewOverlayImg.style.maxHeight = '';

        // Remove floating frequency panel if present
        const freqFloating = document.getElementById('lightbox-freq-floating');
        if (freqFloating) {
            freqFloating.remove();
        }
        // Clear pending adds and removes on close
        pendingAddTags.clear();
        pendingRemoveTags.clear();
        pendingPatternChange = null;
    }

    // Show real-size overlay (strict 1:1 based on mm dimensions)
    function showRealSizeOverlay(imageSrc, image) {
        if (!image || (!image.width && !image.length)) {
            console.warn('Cannot show real size: no dimensions available');
            return;
        }

        const widthMm = parseFloat(image.width);
        const lengthMm = parseFloat(image.length);
        const currentDPI = window.getCurrentDPI();

        // Calculate pixel dimensions
        const widthPx = widthMm ? window.mmToPixels(widthMm, currentDPI) : null;
        const lengthPx = lengthMm ? window.mmToPixels(lengthMm, currentDPI) : null;

        // Set image source
        previewOverlayImg.src = imageSrc;
        previewOverlayImg.alt = image.id ? `Real size preview of image ${image.id}` : 'Real size preview';

        // Set strict dimensions (no zoom, no scaling)
        if (widthPx && lengthPx) {
            // Use the larger dimension to determine orientation
            if (widthPx > lengthPx) {
                previewOverlayImg.style.width = `${widthPx}px`;
                previewOverlayImg.style.height = `${lengthPx}px`;
            } else {
                previewOverlayImg.style.width = `${widthPx}px`;
                previewOverlayImg.style.height = `${lengthPx}px`;
            }
            previewOverlayImg.style.maxWidth = `${widthPx}px`;
            previewOverlayImg.style.maxHeight = `${lengthPx}px`;
        } else if (widthPx) {
            previewOverlayImg.style.width = `${widthPx}px`;
            previewOverlayImg.style.height = 'auto';
            previewOverlayImg.style.maxWidth = `${widthPx}px`;
            previewOverlayImg.style.maxHeight = 'none';
        } else if (lengthPx) {
            previewOverlayImg.style.width = 'auto';
            previewOverlayImg.style.height = `${lengthPx}px`;
            previewOverlayImg.style.maxWidth = 'none';
            previewOverlayImg.style.maxHeight = `${lengthPx}px`;
        }

        // Show overlay first
        imagePreviewOverlay.classList.add('show');

        // Center the image after it loads
        const centerImage = () => {
            const overlay = imagePreviewOverlay;
            const content = document.querySelector('.image-preview-content');
            if (content && previewOverlayImg.complete) {
                // Calculate center position for scrolling
                const scrollLeft = Math.max(0, (content.scrollWidth - overlay.clientWidth) / 2);
                const scrollTop = Math.max(0, (content.scrollHeight - overlay.clientHeight) / 2);
                overlay.scrollLeft = scrollLeft;
                overlay.scrollTop = scrollTop;
            }
        };

        // Center immediately if image already loaded, otherwise wait for load
        if (previewOverlayImg.complete) {
            setTimeout(centerImage, 50);
        } else {
            previewOverlayImg.onload = () => {
                setTimeout(centerImage, 50);
            };
        }

        // Hide navigation arrows
        previewNavLeft.classList.add('hidden');
        previewNavRight.classList.add('hidden');

        // Show settings button and dimension info
        const settingsBtn = document.getElementById('preview-overlay-settings');
        const dimensionInfo = document.getElementById('preview-dimension-info');
        
        settingsBtn.classList.remove('hidden');
        dimensionInfo.classList.remove('hidden');

        // Update dimension info
        const dimensionText = [];
        if (widthMm) dimensionText.push(`Width: ${widthMm}mm`);
        if (lengthMm) dimensionText.push(`Length: ${lengthMm}mm`);
        dimensionText.push(`(Real Size)`);
        dimensionInfo.innerHTML = `
            <div class="dimension-text">${dimensionText.join(' × ')}</div>
            <div class="dpi-text">Detected DPI: ${currentDPI.toFixed(1)}</div>
        `;

        // Prevent body scrolling
        document.body.style.overflow = 'hidden';

        // Add pan event listeners
        addPanEventListeners();

        console.log('Real size overlay opened:', {
            widthMm,
            lengthMm,
            widthPx,
            lengthPx,
            dpi: currentDPI
        });
    }

    // Pan functionality variables
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    // Pan functionality functions
    function addPanEventListeners() {
        imagePreviewOverlay.addEventListener('mousedown', startPan);
        imagePreviewOverlay.addEventListener('mousemove', doPan);
        imagePreviewOverlay.addEventListener('mouseup', endPan);
        imagePreviewOverlay.addEventListener('mouseleave', endPan);

        // Prevent default drag behavior on images
        previewOverlayImg.addEventListener('dragstart', (e) => e.preventDefault());
    }

    function removePanEventListeners() {
        imagePreviewOverlay.removeEventListener('mousedown', startPan);
        imagePreviewOverlay.removeEventListener('mousemove', doPan);
        imagePreviewOverlay.removeEventListener('mouseup', endPan);
        imagePreviewOverlay.removeEventListener('mouseleave', endPan);
    }

    function startPan(e) {
        // Don't start panning if clicking on the close button
        if (e.target.id === 'preview-overlay-close') return;

        isPanning = true;
        imagePreviewOverlay.classList.add('panning');

        startX = e.clientX;
        startY = e.clientY;
        scrollLeft = imagePreviewOverlay.scrollLeft;
        scrollTop = imagePreviewOverlay.scrollTop;

        e.preventDefault();
    }

    function doPan(e) {
        if (!isPanning) return;

        e.preventDefault();

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        imagePreviewOverlay.scrollLeft = scrollLeft - deltaX;
        imagePreviewOverlay.scrollTop = scrollTop - deltaY;
    }

    function endPan() {
        isPanning = false;
        imagePreviewOverlay.classList.remove('panning');
    }

    // Selection Pool Preview Functions
    function showSelectionPoolPreview(clickedImage, allImages, clickedIndex) {
        console.log('showSelectionPoolPreview called with:', {
            clickedImage: clickedImage.id,
            allImagesCount: allImages.length,
            clickedIndex: clickedIndex
        });

        // Set up navigation data
        currentPreviewImages = allImages;
        currentPreviewIndex = clickedIndex;
        isSelectionPoolPreview = true;

        // Show the clicked image
        const imageSrc = `${API_URL}/${clickedImage.filepath.replace(/\\/g, '/')}`;
        previewOverlayImg.src = imageSrc;
        previewOverlayImg.alt = `Full size preview of image ${clickedImage.id}`;

        // Reset scroll position to top-left
        imagePreviewOverlay.scrollTop = 0;
        imagePreviewOverlay.scrollLeft = 0;

        // Show overlay first
        imagePreviewOverlay.classList.add('show');

        // Update navigation arrows visibility (after overlay is shown)
        updateNavigationArrows();

        // Prevent body scrolling and add pan functionality
        document.body.style.overflow = 'hidden';
        addPanEventListeners();

        console.log('Selection Pool preview opened for image:', clickedImage.id, 'at index:', clickedIndex);
        console.log('Navigation arrows should be visible now');
    }

    function updateNavigationArrows() {
        console.log('updateNavigationArrows called:', {
            currentPreviewIndex: currentPreviewIndex,
            totalImages: currentPreviewImages.length,
            isSelectionPoolPreview: isSelectionPoolPreview
        });

        if (!isSelectionPoolPreview) {
            // Hide arrows for regular library preview
            previewNavLeft.classList.add('hidden');
            previewNavRight.classList.add('hidden');
            console.log('Hiding arrows - not Selection Pool preview');
            return;
        }

        // Show/hide arrows based on current position in Selection Pool
        if (currentPreviewIndex <= 0) {
            previewNavLeft.classList.add('hidden');
            console.log('Hiding left arrow - at first image');
        } else {
            previewNavLeft.classList.remove('hidden');
            console.log('Showing left arrow');
        }

        if (currentPreviewIndex >= currentPreviewImages.length - 1) {
            previewNavRight.classList.add('hidden');
            console.log('Hiding right arrow - at last image');
        } else {
            previewNavRight.classList.remove('hidden');
            console.log('Showing right arrow');
        }

        console.log('Navigation arrows updated');
    }

    function navigatePreview(direction) {
        if (!isSelectionPoolPreview) return;

        let newIndex = currentPreviewIndex;

        if (direction === 'left' && currentPreviewIndex > 0) {
            newIndex = currentPreviewIndex - 1;
        } else if (direction === 'right' && currentPreviewIndex < currentPreviewImages.length - 1) {
            newIndex = currentPreviewIndex + 1;
        }

        if (newIndex !== currentPreviewIndex) {
            currentPreviewIndex = newIndex;
            const newImage = currentPreviewImages[newIndex];
            const newImageSrc = `${API_URL}/${newImage.filepath.replace(/\\/g, '/')}`;

            previewOverlayImg.src = newImageSrc;
            previewOverlayImg.alt = `Full size preview of image ${newImage.id}`;

            // Reset scroll position for new image
            imagePreviewOverlay.scrollTop = 0;
            imagePreviewOverlay.scrollLeft = 0;

            // Update arrow visibility
            updateNavigationArrows();

            console.log('Navigated to image:', newImage.id, 'at index:', newIndex);
        }
    }

    async function createProject() {
        const projectName = projectNameInput.value.trim();

        // Get current search tags and mode
        const currentSearchTags = searchTags.map(tag => tag.text);
        const searchMode = tagSearchMode;
        
        console.log('[FRONTEND] createProject - mode:', searchMode, 'tags:', currentSearchTags);
        console.log('[FRONTEND] createProject - selectedImages:', selectedImages, 'tagSelectedImages:', tagSelectedImages);
        
        // Use the same validation logic as calculateSelectionCount to ensure consistency
        let allSelectedImages;
        if (currentSearchTags.length > 0) {
            try {
                // Fetch all images to verify which images match the current mode
                const sessionToken = localStorage.getItem('sessionToken');
                const headers = {};
                if (sessionToken) {
                    headers['Authorization'] = `Bearer ${sessionToken}`;
                }
                const allImagesResponse = await fetch(`${API_URL}/images`, { headers });
                const allImages = allImagesResponse.ok ? await allImagesResponse.json() : [];
                
                const currentTagsLower = currentSearchTags.map(t => t.toLowerCase());
                let validManualSelections;
                let validTagSelections;
                
                if (searchMode === 'AND') {
                    // AND mode: filter both manual and tag-selected images to only include those matching ALL tags
                    validManualSelections = selectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        if (!img) return false;
                        const imageTags = (img.tags || []).map(t => t.toLowerCase());
                        if (exactWordMode) {
                            // Exact word mode: each search tag must be present exactly
                            return currentTagsLower.every(tag => imageTags.includes(tag));
                        } else {
                            // Partial mode: each search tag must match at least one image tag as a substring
                            return currentTagsLower.every(tag =>
                                imageTags.some(imageTag => imageTag.includes(tag))
                            );
                        }
                    });
                    
                    // Also verify tag-selected images match ALL tags
                    validTagSelections = tagSelectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        if (!img) return false;
                        const imageTags = (img.tags || []).map(t => t.toLowerCase());
                        if (exactWordMode) {
                            return currentTagsLower.every(tag => imageTags.includes(tag));
                        } else {
                            return currentTagsLower.every(tag =>
                                imageTags.some(imageTag => imageTag.includes(tag))
                            );
                        }
                    });
                    
                    console.log('[FRONTEND] createProject AND mode - validManualSelections:', validManualSelections, 'validTagSelections:', validTagSelections);
                    allSelectedImages = [...new Set([...validManualSelections, ...validTagSelections])];
                } else {
                    // OR mode: all manually selected images count (no filtering by tags)
                    // But we still verify the images exist
                    validManualSelections = selectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        return img !== undefined;
                    });
                    // OR mode: tag-selected images should already be correct from API, but verify they exist
                    validTagSelections = tagSelectedImages.filter(imgId => {
                        const img = allImages.find(i => i.id === imgId);
                        return img !== undefined;
                    });
                    
                    console.log('[FRONTEND] createProject OR mode - validManualSelections:', validManualSelections, 'validTagSelections:', validTagSelections);
                    allSelectedImages = [...new Set([...validManualSelections, ...validTagSelections])];
                }
            } catch (error) {
                console.error('[FRONTEND] Error fetching images for createProject:', error);
                // Fallback to simple combination if fetch fails
                allSelectedImages = [...new Set([...selectedImages, ...tagSelectedImages])];
            }
        } else {
            // No active tags: combine all selections (no filtering needed)
            allSelectedImages = [...new Set([...selectedImages, ...tagSelectedImages])];
        }

        console.log('[FRONTEND] Creating project - searchMode:', searchMode, 'currentSearchTags:', currentSearchTags);
        console.log('[FRONTEND] Creating project with selected images:', selectedImages);
        console.log('[FRONTEND] Creating project with tag-selected images:', tagSelectedImages);
        console.log('[FRONTEND] Creating project with combined images:', allSelectedImages);

        if (!projectName) {
            alert('Please enter a project name.');
            return;
        }

        // Check if we have selected images (check combined selections)
        if (allSelectedImages.length === 0) {
            alert('Please select at least one image before creating a project.');
            return;
        }

        // Check if project name already exists
        if (projects.some(p => p.name.toLowerCase() === projectName.toLowerCase())) {
            alert('A project with this name already exists.');
            return;
        }

        // Store the count before clearing selection
        const imageCount = allSelectedImages.length;

        try {
            // Generate selection breakdown before saving
            const breakdown = generateSelectionBreakdown();
            const newProject = await saveProjectToAPI(projectName, [...allSelectedImages], breakdown);
            displayProjects();

            // Store the created project for navigation
            lastCreatedProject = newProject;

            // Hide project name modal first, then clear selection
            hideProjectNameModal();
            deselectAllImages();

            // Show success confirmation modal
            showProjectCreatedModal(projectName, imageCount);
        } catch (error) {
            alert('Failed to create project. Please try again.');
        }
    }

    async function loadProjectsFromAPI() {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            const response = await fetch(`${API_URL}/projects`, {
                headers: headers
            });
            if (response.ok) {
                projects = await response.json();
                console.log('Loaded projects from API:', projects.length);
                
                // Regenerate selection_breakdown for projects that don't have it
                projects.forEach(project => {
                    if (!project.selection_breakdown) {
                        console.log(`Regenerating selection_breakdown for project ${project.id}`);
                        project.selection_breakdown = generateBreakdownFromProject(project);
                    }
                });
                
                // Log first project structure to debug
                if (projects.length > 0) {
                    console.log('Sample project structure:', JSON.stringify(projects[0], null, 2));
                }
            } else {
                console.error('Failed to load projects:', response.statusText);
                projects = [];
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            projects = [];
        }
    }

    async function saveProjectToAPI(projectName, imageIds, breakdown = null) {
        try {
            const projectData = {
                name: projectName,
                image_ids: imageIds
            };

            // Add breakdown metadata if provided
            if (breakdown) {
                projectData.selection_breakdown = breakdown;
                console.log('Saving project with breakdown:', JSON.stringify(breakdown, null, 2));
            }

            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                const newProject = await response.json();
                // Add selection_breakdown to the project object if it was provided
                // (API might not return it, so we preserve it from what we sent)
                if (breakdown) {
                    newProject.selection_breakdown = breakdown;
                }
                projects.push(newProject);
                console.log('Project saved to API:', newProject);
                console.log('Project with breakdown:', JSON.stringify(newProject, null, 2));
                return newProject;
            } else {
                console.error('Failed to save project:', response.statusText);
                throw new Error('Failed to save project');
            }
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
        }
    }

    async function deleteProjectFromAPI(projectId) {
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            
            const response = await fetch(`${API_URL}/projects/${projectId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (response.ok) {
                projects = projects.filter(p => p.id !== projectId);
                console.log('Project deleted from API:', projectId);
                return true;
            } else {
                const errorText = await response.text();
                console.error('Failed to delete project:', response.status, response.statusText, errorText);
                throw new Error(`Failed to delete project: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }

    function toggleProjectView() {
        isDetailedProjectView = !isDetailedProjectView;

        // Update toggle button appearance
        if (isDetailedProjectView) {
            projectViewToggleBtn.classList.add('detailed-mode');
            toggleIcon.textContent = '📊';
            toggleText.textContent = 'Present View';
        } else {
            projectViewToggleBtn.classList.remove('detailed-mode');
            toggleIcon.textContent = '📋';
            toggleText.textContent = 'Detailed View';
        }

        // Update project list classes
        if (isDetailedProjectView) {
            projectList.classList.add('detailed-view');
        } else {
            projectList.classList.remove('detailed-view');
        }

        // Refresh the project display
        displayProjects();
    }

    async function toggleEmailHistory(projectId, toggleButton, emailList) {
        if (emailList.classList.contains('expanded')) {
            // Collapse
            emailList.classList.remove('expanded');
            toggleButton.textContent = 'Show All';
        } else {
            // Expand and load email history
            try {
                const response = await fetch(`${API_URL}/projects/${projectId}/email-history`);
                if (response.ok) {
                    const emailHistory = await response.json();

                    emailList.innerHTML = '';

                    if (emailHistory.length === 0) {
                        emailList.innerHTML = '<div class="email-history-item">No emails sent yet</div>';
                    } else {
                        emailHistory.forEach(email => {
                            const emailItem = document.createElement('div');
                            emailItem.className = 'email-history-item';

                            const date = new Date(email.sent_at);
                            const statusClass = email.success ? 'success' : 'failed';
                            const statusText = email.success ? 'Sent' : 'Failed';

                            emailItem.innerHTML = `
                                <div class="email-recipient">${email.recipient_email}</div>
                                <div class="email-date">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                <span class="email-status ${statusClass}">${statusText}</span>
                            `;

                            emailList.appendChild(emailItem);
                        });
                    }

                    emailList.classList.add('expanded');
                    toggleButton.textContent = 'Hide All';
                } else {
                    console.error('Failed to load email history');
                    emailList.innerHTML = '<div class="email-history-item">Failed to load email history</div>';
                    emailList.classList.add('expanded');
                    toggleButton.textContent = 'Hide All';
                }
            } catch (error) {
                console.error('Error loading email history:', error);
                emailList.innerHTML = '<div class="email-history-item">Error loading email history</div>';
                emailList.classList.add('expanded');
                toggleButton.textContent = 'Hide All';
            }
        }
    }

    async function loadLastEmailInfo(projectId, emailSection) {
        console.log('=== LOAD LAST EMAIL INFO START ===');
        console.log('Loading last email info for project:', projectId);

        try {
            const response = await fetch(`${API_URL}/projects/${projectId}/email-history`);
            console.log('Email history API response status:', response.status);

            if (response.ok) {
                const emailHistory = await response.json();
                console.log('Email history data:', emailHistory);

                if (emailHistory.length > 0) {
                    const lastEmail = emailHistory[0]; // Most recent email
                    console.log('Last email:', lastEmail);

                    const lastEmailRow = document.createElement('div');
                    lastEmailRow.className = 'project-detail-row';

                    const date = new Date(lastEmail.sent_at);
                    const statusText = lastEmail.success ? '✅' : '❌';

                    lastEmailRow.innerHTML = `<strong>📧 Last email:</strong> ${lastEmail.recipient_email} (${date.toLocaleDateString()}) ${statusText}`;
                    emailSection.appendChild(lastEmailRow);
                    console.log('Last email row added to section');
                } else {
                    console.log('No email history found');
                    const noEmailRow = document.createElement('div');
                    noEmailRow.className = 'project-detail-row';
                    noEmailRow.innerHTML = '<strong>📧 Last email:</strong> No emails sent yet';
                    emailSection.appendChild(noEmailRow);
                }
            } else {
                console.log('Email history API failed:', response.status);
            }
        } catch (error) {
            console.error('Error loading last email info:', error);
        }

        console.log('=== LOAD LAST EMAIL INFO END ===');
    }

    async function displayProjects() {
        if (projects.length === 0) {
            projectList.innerHTML = '<p class="text">No projects created yet. Select images in the Image Library and click "Add to Project" to create your first project.</p>';
            return;
        }

        projectList.innerHTML = '';

        // Sort projects by creation date - latest first (top-left corner)
        const sortedProjects = [...projects].sort((a, b) => {
            // Sort by ID in descending order (assuming higher ID = more recent)
            return b.id - a.id;
        });

        for (const project of sortedProjects) {
            const projectCard = document.createElement('div');
            projectCard.className = isDetailedProjectView ? 'project-card detailed-view' : 'project-card';

            // Project card header with title and metadata
            const cardHeader = document.createElement('div');
            cardHeader.className = 'project-card-header';

            const titleSection = document.createElement('div');
            titleSection.className = 'project-title-section';

            const projectTitle = document.createElement('h3');
            projectTitle.className = 'project-title';
            projectTitle.textContent = project.name;

            if (isDetailedProjectView) {
                // Detailed view: Show comprehensive information
                const detailedInfo = document.createElement('div');
                detailedInfo.className = 'project-detailed-info';

                // Creation date
                const date = new Date(project.created_at);
                const dateRow = document.createElement('div');
                dateRow.className = 'project-detail-row';
                dateRow.innerHTML = `<strong>📅 Created:</strong> ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                detailedInfo.appendChild(dateRow);

                // Image count
                const countRow = document.createElement('div');
                countRow.className = 'project-detail-row';
                countRow.innerHTML = `<strong>📊 Images:</strong> ${project.image_ids.length} images`;
                detailedInfo.appendChild(countRow);

                // Creator/Owner
                if (project.ownership) {
                    const ownerRow = document.createElement('div');
                    ownerRow.className = 'project-detail-row';
                    const emailPrefix = window.getEmailPrefix(project.ownership);
                    ownerRow.innerHTML = `<strong>👤 Created by:</strong> ${emailPrefix}`;
                    detailedInfo.appendChild(ownerRow);
                }

                // Email history section
                const emailSection = document.createElement('div');
                emailSection.className = 'email-history-section';

                // Load and show last email info immediately
                loadLastEmailInfo(project.id, emailSection);

                const emailHeader = document.createElement('div');
                emailHeader.className = 'email-history-header';
                emailHeader.innerHTML = '<strong>📧 Email History:</strong>';

                const emailToggle = document.createElement('button');
                emailToggle.className = 'email-history-toggle';
                emailToggle.textContent = 'Show All';
                emailToggle.dataset.projectId = project.id;

                const emailList = document.createElement('div');
                emailList.className = 'email-history-list';
                emailList.id = `email-history-${project.id}`;

                emailToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleEmailHistory(project.id, emailToggle, emailList);
                });

                emailHeader.appendChild(emailToggle);
                emailSection.appendChild(emailHeader);
                emailSection.appendChild(emailList);
                detailedInfo.appendChild(emailSection);

                titleSection.appendChild(projectTitle);
                titleSection.appendChild(detailedInfo);
            } else {
                // Present view: Show basic metadata
                const projectMeta = document.createElement('div');
                projectMeta.className = 'project-meta';

                const imageCount = document.createElement('span');
                imageCount.className = 'project-image-count';
                imageCount.textContent = `${project.image_ids.length} images`;

                const createdDate = document.createElement('span');
                createdDate.className = 'project-created-date';
                const date = new Date(project.created_at);
                createdDate.textContent = `Created ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

                const creatorEmail = document.createElement('span');
                creatorEmail.className = 'project-creator-email';
                if (project.ownership) {
                    const emailPrefix = window.getEmailPrefix(project.ownership);
                    creatorEmail.textContent = emailPrefix; // Match image library format (no "by" prefix)
                }

                projectMeta.appendChild(imageCount);
                projectMeta.appendChild(createdDate);
                if (project.ownership) {
                    projectMeta.appendChild(creatorEmail);
                }
                titleSection.appendChild(projectTitle);
                titleSection.appendChild(projectMeta);
            }

            const actionSection = document.createElement('div');
            actionSection.className = 'project-actions';

            const shareBtn = document.createElement('button');
            shareBtn.className = 'button share-project-btn';
            shareBtn.innerHTML = '';
            shareBtn.title = 'Share project via email';
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering project detail modal
                showShareProjectModal(project);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'button delete-project-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete project';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering project detail modal
                showDeleteProjectModal(project.id);
            });

            actionSection.appendChild(shareBtn);
            actionSection.appendChild(deleteBtn);
            cardHeader.appendChild(titleSection);
            cardHeader.appendChild(actionSection);

            // Only show image preview in present view
            if (!isDetailedProjectView) {
                // Project images preview (first few images)
                const projectPreview = document.createElement('div');
                projectPreview.className = 'project-preview';

                // Get image data for this project
                try {
                    const sessionToken = localStorage.getItem('sessionToken');
                    const headers = {};
                    if (sessionToken) {
                        headers['Authorization'] = `Bearer ${sessionToken}`;
                    }
                    const response = await fetch(`${API_URL}/images`, {
                        headers: headers
                    });
                    const allImages = await response.json();
                    const projectImageData = allImages.filter(img => project.image_ids.includes(img.id));

                    // Show first 6 images as preview
                    const previewImages = projectImageData.slice(0, 6);
                    previewImages.forEach(image => {
                        const previewImg = document.createElement('img');
                        previewImg.className = 'project-preview-image';
                        previewImg.src = `${API_URL}/${image.filepath.replace(/\\/g, '/')}`;
                        projectPreview.appendChild(previewImg);
                    });

                    // Add "more" indicator if there are more images
                    if (projectImageData.length > 6) {
                        const moreIndicator = document.createElement('div');
                        moreIndicator.className = 'project-more-indicator';
                        moreIndicator.textContent = `+${projectImageData.length - 6} more`;
                        projectPreview.appendChild(moreIndicator);
                    }
                } catch (error) {
                    console.error('Error loading project images:', error);
                }

                projectCard.appendChild(cardHeader);
                projectCard.appendChild(projectPreview);
            } else {
                // Detailed view: Only show header
                projectCard.appendChild(cardHeader);
            }

            // Add click handler to open project detail modal
            projectCard.addEventListener('click', () => {
                showProjectDetailModal(project);
            });

            // Make project card look clickable
            projectCard.style.cursor = 'pointer';

            projectList.appendChild(projectCard);
        }
    }

    function showDeleteProjectModal(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        
        deleteProjectConfirmModal.dataset.projectId = projectId;
        deleteProjectName.textContent = project.name;
        deleteProjectConfirmModal.classList.remove('is-hidden');
    }

    function hideDeleteProjectModal() {
        deleteProjectConfirmModal.classList.add('is-hidden');
        delete deleteProjectConfirmModal.dataset.projectId;
    }

    async function deleteProject(projectId) {
        try {
            await deleteProjectFromAPI(projectId);
            displayProjects();
            hideDeleteProjectModal();
        } catch (error) {
            alert('Failed to delete project. Please try again.');
        }
    }

    async function refreshEmailHistoryDisplays(projectId) {
        console.log('=== REFRESH EMAIL HISTORY START ===');
        console.log('Refreshing email history displays for project:', projectId);
        console.log('isDetailedProjectView:', isDetailedProjectView);
        console.log('projectDetailModal hidden:', projectDetailModal.classList.contains('is-hidden'));

        // 1. Update email history in detailed project view
        if (isDetailedProjectView) {
            console.log('Updating email history in detailed project view');
            await updateProjectEmailHistory(projectId);
        }

        // 2. Refresh project detail modal if it's open for this project
        if (!projectDetailModal.classList.contains('is-hidden')) {
            const currentProjectId = projectDetailModal.dataset.projectId;
            console.log('Current modal project ID:', currentProjectId, 'Target project ID:', projectId);
            if (currentProjectId == projectId) {
                console.log('Refreshing project detail modal');
                const project = projects.find(p => p.id == projectId);
                if (project) {
                    showProjectDetailModal(project);
                } else {
                    console.log('Project not found in projects array');
                }
            } else {
                console.log('Modal is open but for different project');
            }
        }

        console.log('=== REFRESH EMAIL HISTORY END ===');
    }

    async function updateProjectEmailHistory(projectId) {
        console.log('=== UPDATE PROJECT EMAIL HISTORY START ===');
        console.log('Updating email history for project:', projectId);

        // Find the project card for this project ID
        const projectCards = document.querySelectorAll('.project-card.detailed-view');

        for (const card of projectCards) {
            // Find the email history section in this card
            const emailSection = card.querySelector('.email-history-section');
            if (emailSection) {
                // Check if this card is for the target project by looking at the toggle button
                const toggleButton = emailSection.querySelector('.email-history-toggle');
                if (toggleButton && toggleButton.dataset.projectId == projectId) {
                    console.log('Found matching project card, updating email history');

                    // Clear existing last email info
                    const existingEmailRow = emailSection.querySelector('.project-detail-row');
                    if (existingEmailRow) {
                        existingEmailRow.remove();
                    }

                    // Add updated last email info
                    await loadLastEmailInfo(projectId, emailSection);

                    // If email history is expanded, refresh it too
                    const emailList = emailSection.querySelector('.email-history-list');
                    if (emailList && emailList.classList.contains('expanded')) {
                        console.log('Email history is expanded, refreshing list');
                        await toggleEmailHistory(projectId, toggleButton, emailList);
                        await toggleEmailHistory(projectId, toggleButton, emailList); // Toggle twice to refresh
                    }

                    break;
                }
            }
        }

        console.log('=== UPDATE PROJECT EMAIL HISTORY END ===');
    }

    // Autocomplete Functions
    async function showAutocomplete(query) {
        if (query.length < 2) {
            hideAutocomplete();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/tags?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch tags');
            }

            const tags = await response.json();
            autocompleteItems = tags.slice(0, 10); // Limit to 10 suggestions

            if (autocompleteItems.length === 0) {
                hideAutocomplete();
                return;
            }

            renderAutocomplete();
            autocompleteDropdown.classList.add('show');
            autocompleteVisible = true;
            autocompleteHighlightIndex = -1;

        } catch (error) {
            console.error('Error fetching autocomplete suggestions:', error);
            hideAutocomplete();
        }
    }

    function renderAutocomplete() {
        autocompleteDropdown.innerHTML = '';

        autocompleteItems.forEach((tag, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.dataset.index = index;

            item.innerHTML = `
                <span class="autocomplete-item-name">${tag.name}</span>
                <span class="autocomplete-item-count">${tag.usage_count}</span>
            `;

            item.addEventListener('click', () => {
                selectAutocompleteItem(tag.name);
            });

            autocompleteDropdown.appendChild(item);
        });
    }

    function hideAutocomplete() {
        autocompleteDropdown.classList.remove('show');
        autocompleteVisible = false;
        autocompleteHighlightIndex = -1;
        autocompleteItems = [];
    }

    function selectAutocompleteItem(tagName) {
        const currentValue = librarySearchInput.value;
        const lastCommaIndex = currentValue.lastIndexOf(',');

        let newValue;
        if (lastCommaIndex === -1) {
            // No comma, replace entire value
            newValue = tagName;
        } else {
            // Replace text after last comma
            newValue = currentValue.substring(0, lastCommaIndex + 1) + ' ' + tagName;
        }

        librarySearchInput.value = newValue;
        hideAutocomplete();
        librarySearchInput.focus();
    }

    function highlightAutocompleteItem(direction) {
        if (!autocompleteVisible || autocompleteItems.length === 0) return;

        // Remove previous highlight
        const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
        items.forEach(item => item.classList.remove('highlighted'));

        // Update highlight index
        if (direction === 'down') {
            autocompleteHighlightIndex = Math.min(autocompleteHighlightIndex + 1, autocompleteItems.length - 1);
        } else if (direction === 'up') {
            autocompleteHighlightIndex = Math.max(autocompleteHighlightIndex - 1, -1);
        }

        // Apply new highlight
        if (autocompleteHighlightIndex >= 0) {
            items[autocompleteHighlightIndex].classList.add('highlighted');
        }
    }

    function selectHighlightedItem() {
        // Only select an item if one is explicitly highlighted with arrow keys.
        // If nothing is highlighted, pressing Enter/Tab should *not* replace
        // the user's typed text (e.g. "OST") with a suggestion like "ghost spider".
        if (!autocompleteVisible || autocompleteItems.length === 0) {
            return false;
        }

        if (autocompleteHighlightIndex >= 0 && autocompleteHighlightIndex < autocompleteItems.length) {
            selectAutocompleteItem(autocompleteItems[autocompleteHighlightIndex].name);
            return true;
        }

        return false;
    }

    // Authentication Functions
    async function checkAuthentication() {
        const sessionToken = localStorage.getItem('sessionToken');

        if (!sessionToken) {
            window.location.href = '/login.html';
            return false;
        }

        try {
            const response = await fetch(`${API_URL}/auth/verify-session`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });

            if (!response.ok) {
                localStorage.removeItem('sessionToken');
                window.location.href = '/login.html';
                return false;
            }

            const result = await response.json();
            currentUser = result.user;

            // Get user level (default to 1 if not set)
            // Handle both string and number formats
            let userLevel = 1;
            if (currentUser.level !== undefined && currentUser.level !== null) {
                userLevel = parseInt(currentUser.level, 10);
                if (isNaN(userLevel)) {
                    userLevel = 1;
                }
            }
            console.log('=== USER LEVEL CHECK ===');
            console.log('Raw level value:', currentUser.level);
            console.log('Parsed level:', userLevel);
            console.log('Level type:', typeof currentUser.level);
            console.log('User role:', currentUser.role);
            console.log('User email:', currentUser.email);
            console.log('Is level 3?', (userLevel === 3));
            console.log('Full currentUser object:', JSON.stringify(currentUser, null, 2));
            console.log('========================');

            // Get navigation elements
            const adminLink = document.getElementById('nav-admin');
            const settingsLink = document.getElementById('nav-settings');
            const tagsLink = document.getElementById('nav-tags');

            // Level-based visibility:
            // Level 1: Only Image Library, Upload Image, and Project
            // Level 2: Image Library, Upload Image, Project, Tags (Admin/Settings based on admin role)
            // Level 3: All menu items (full access)
            if (userLevel === 1 || userLevel === '1') {
                console.log('Level 1 user detected - hiding Tags, Admin Panel, and Settings');
                // Hide Tags, Admin Panel, and Settings for level 1 users (regardless of admin role)
                if (tagsLink) {
                    tagsLink.classList.add('is-hidden');
                    tagsLink.style.display = 'none';
                }
                if (adminLink) {
                    adminLink.classList.add('is-hidden');
                    adminLink.style.display = 'none';
                }
                if (settingsLink) {
                    settingsLink.classList.add('is-hidden');
                    settingsLink.style.display = 'none';
                }
            } else if (userLevel === 3) {
                console.log('Level 3 user detected - showing all menu items');
                console.log('Elements found:', { tagsLink: !!tagsLink, adminLink: !!adminLink, settingsLink: !!settingsLink });
                // Level 3 users can see all menu items regardless of admin role
                // Force visibility using both class removal and inline style
                if (tagsLink) {
                    tagsLink.classList.remove('is-hidden');
                    tagsLink.style.setProperty('display', 'block', 'important');
                    tagsLink.style.setProperty('visibility', 'visible', 'important');
                    tagsLink.style.setProperty('opacity', '1', 'important');
                    console.log('Tags link - removed is-hidden, forced display to block');
                } else {
                    console.error('Tags link not found!');
                }
                if (adminLink) {
                    adminLink.classList.remove('is-hidden');
                    adminLink.style.setProperty('display', 'block', 'important');
                    adminLink.style.setProperty('visibility', 'visible', 'important');
                    adminLink.style.setProperty('opacity', '1', 'important');
                    console.log('Admin link - removed is-hidden, forced display to block');
                } else {
                    console.error('Admin link not found!');
                }
                if (settingsLink) {
                    settingsLink.classList.remove('is-hidden');
                    settingsLink.style.setProperty('display', 'block', 'important');
                    settingsLink.style.setProperty('visibility', 'visible', 'important');
                    settingsLink.style.setProperty('opacity', '1', 'important');
                    console.log('Settings link - removed is-hidden, forced display to block');
                } else {
                    console.error('Settings link not found!');
                }
            } else {
                // Level 2 users: Show Tags, Admin/Settings based on admin role
                if (currentUser.role === 'admin') {
                    if (adminLink) {
                        adminLink.classList.remove('is-hidden');
                        adminLink.style.display = '';
                    }
                    if (settingsLink) {
                        settingsLink.classList.remove('is-hidden');
                        settingsLink.style.display = '';
                    }
                } else {
                    if (adminLink) {
                        adminLink.classList.add('is-hidden');
                        adminLink.style.display = 'none';
                    }
                    if (settingsLink) {
                        settingsLink.classList.add('is-hidden');
                        settingsLink.style.display = 'none';
                    }
                }
                // Show Tags for level 2 users
                if (tagsLink) {
                    tagsLink.classList.remove('is-hidden');
                    tagsLink.style.display = '';
                }
            }

            // Update email display in headers
            updateUserEmailDisplay();

            return true;

        } catch (error) {
            console.error('Authentication check failed:', error);
            localStorage.removeItem('sessionToken');
            window.location.href = '/login.html';
            return false;
        }
    }

    function updateUserEmailDisplay() {
        const emailDisplays = [
            document.getElementById('user-email-display'),
            document.getElementById('user-email-display-upload'),
            document.getElementById('user-email-display-project'),
            document.getElementById('user-email-display-admin')
        ];

        const email = currentUser ? currentUser.email : '';
        const userLevel = currentUser ? (parseInt(currentUser.level, 10) || 1) : 1;
        const displayText = email ? `${email} (level ${userLevel})` : '';
        
        emailDisplays.forEach(display => {
            if (display) {
                display.textContent = displayText;
                display.style.display = email ? 'block' : 'none';
            }
        });
    }

    function hasAdminPrivileges() {
        if (!currentUser) return false;
        const userLevel = parseInt(currentUser.level, 10) || 1;
        return currentUser.role === 'admin' || userLevel === 3;
    }

    function openSettings() {
        if (hasAdminPrivileges()) {
            navigateTo('admin');
        } else {
            alert('Admin or level 3 access required');
        }
    }

    // Admin Panel Functions
    async function loadAdminUsers() {
        const sessionToken = localStorage.getItem('sessionToken');
        const adminLoading = document.getElementById('admin-loading');
        const adminUsersContent = document.getElementById('admin-users-content');
        const adminMessage = document.getElementById('admin-message');
        
        if (!sessionToken) {
            window.location.href = '/login.html';
            return;
        }

        adminLoading.classList.remove('hidden');
        adminUsersContent.classList.add('hidden');
        adminMessage.classList.add('hidden');

        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
            
            if (response.status === 401 || response.status === 403) {
                const errorText = await response.text().catch(() => '');
                console.error('Admin loadAdminUsers auth error:', response.status, errorText);
                showAdminMessage('Access denied. Please log in with admin or level 3 rights.', 'error');
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            
            const users = await response.json();
            displayAdminUsers(users);
            
        } catch (error) {
            console.error('Error loading users:', error);
            showAdminMessage('Failed to load users', 'error');
        } finally {
            adminLoading.classList.add('hidden');
            adminUsersContent.classList.remove('hidden');
        }
    }

    function displayAdminUsers(users) {
        const usersTbody = document.getElementById('admin-users-tbody');
        usersTbody.innerHTML = '';
        
        const sessionToken = localStorage.getItem('sessionToken');
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            const statusClass = `status-${user.status}`;
            const level = parseInt(user.level, 10) || 1;
            
            row.innerHTML = `
                <td>${user.email}</td>
                <td><span class="status-badge ${statusClass}">${user.status}</span></td>
                <td>${formatAdminDate(user.created_at)}</td>
                <td>${formatAdminDate(user.last_login)}</td>
                <td>
                    <select class="admin-user-level-select" data-user-id="${user.id}">
                        <option value="1" ${level === 1 ? 'selected' : ''}>Level 1</option>
                        <option value="2" ${level === 2 ? 'selected' : ''}>Level 2</option>
                        <option value="3" ${level === 3 ? 'selected' : ''}>Level 3</option>
                    </select>
                </td>
                <td>
                    <button type="button" class="admin-user-delete-btn" data-user-id="${user.id}" data-user-email="${user.email}">Delete</button>
                </td>
            `;
            
            const levelSelect = row.querySelector('.admin-user-level-select');
            if (levelSelect) {
                levelSelect.addEventListener('change', async (e) => {
                    const newLevel = parseInt(e.target.value, 10);
                    if (!sessionToken) return;
                    try {
                        const response = await fetch(`${API_URL}/admin/users/${user.id}/level`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${sessionToken}`
                            },
                            body: JSON.stringify({ level: newLevel })
                        });
                        if (!response.ok) {
                            throw new Error('Failed to update user level');
                        }
                        showAdminMessage(`Updated ${user.email} to Level ${newLevel}`, 'success');
                    } catch (err) {
                        console.error('Error updating user level:', err);
                        showAdminMessage('Failed to update user level', 'error');
                        // revert select on error
                        e.target.value = String(level);
                    }
                });
            }
            
            const deleteBtn = row.querySelector('.admin-user-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    const confirmed = window.confirm(`Delete user "${user.email}"? This cannot be undone.`);
                    if (!confirmed || !sessionToken) return;
                    try {
                        const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${sessionToken}`
                            }
                        });
                        if (!response.ok) {
                            throw new Error('Failed to delete user');
                        }
                        row.remove();
                        showAdminMessage(`Deleted user ${user.email}`, 'success');
                    } catch (err) {
                        console.error('Error deleting user:', err);
                        showAdminMessage('Failed to delete user', 'error');
                    }
                });
            }
            
            usersTbody.appendChild(row);
        });
    }

    function formatAdminDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        // Format: MM/DD/YYYY HH:MM:SS (local time)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    }

    function showAdminMessage(text, type = 'success') {
        const adminMessage = document.getElementById('admin-message');
        adminMessage.textContent = text;
        adminMessage.className = `admin-message ${type}`;
        adminMessage.classList.remove('hidden');
        
        setTimeout(() => {
            adminMessage.classList.add('hidden');
        }, 5000);
    }

    async function logout() {
        console.log('🚪 Logout function called');
        const sessionToken = localStorage.getItem('sessionToken');
        console.log('Session token:', sessionToken ? 'exists' : 'not found');

        // Call backend logout endpoint to invalidate session
        if (sessionToken) {
            try {
                console.log('📡 Calling backend logout endpoint...');
                const response = await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${sessionToken}` }
                });
                console.log('Backend logout response:', response.status);
            } catch (error) {
                console.error('Error calling logout endpoint:', error);
                // Continue with logout even if backend call fails
            }
        }

        // Clear session token
        console.log('🧹 Clearing session token...');
        localStorage.removeItem('sessionToken');

        // Clear current user
        currentUser = null;
        console.log('👤 Current user cleared');

        // Clear email display
        updateUserEmailDisplay();

        // Redirect to login page
        console.log('🔄 Redirecting to login page...');
        window.location.href = '/login.html';
    }

    // Make functions globally available
    window.openSettings = openSettings;
    window.logout = logout;

    // Add event listener for logout button as backup
    document.addEventListener('DOMContentLoaded', function() {
        const logoutBtn = document.getElementById('nav-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🚪 Logout button clicked via event listener (sidebar footer)');
                logout();
            });
        }

        // Sync exactWordMode variable with button state on page load
        if (exactWordToggleBtn) {
            const buttonIsActive = exactWordToggleBtn.classList.contains('is-active');
            exactWordMode = buttonIsActive;
            console.log('Page load: synced exactWordMode with button state:', exactWordMode);
        }
    });

    // Share Project Functions
    function showShareProjectModal(project) {
        shareProjectName.textContent = project.name;
        shareEmailInput.value = '';
        shareMessageInput.value = '';
        shareProjectModal.classList.remove('is-hidden');
        shareEmailInput.focus();

        // Store project data for sharing
        shareProjectModal.dataset.projectId = project.id;
        shareProjectModal.dataset.projectName = project.name;
    }

    function hideShareProjectModal() {
        shareProjectModal.classList.add('is-hidden');
        shareEmailInput.value = '';
        shareMessageInput.value = '';
        delete shareProjectModal.dataset.projectId;
        delete shareProjectModal.dataset.projectName;
    }

    // Update Tag Modal Functions
    function showUpdateTagModal() {
        console.log('[FRONTEND] showUpdateTagModal called');

        // Get all unique tags from selected images (both manually selected and tag-selected)
        const allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];
        console.log('[FRONTEND] All selected image IDs:', allSelectedImageIds);
        
        if (allSelectedImageIds.length === 0) {
            console.warn('[FRONTEND] No images selected - cannot show modal');
            alert('No images selected. Please select images first.');
            return;
        }

        // Reset state
        tagsToRemove.clear();
        removeAllTags = false;
        tagsToAdd.clear();

        // Hide success modal if visible
        if (tagUpdateSuccessModal) {
            tagUpdateSuccessModal.classList.add('is-hidden');
        }

        // Reset Remove All Tags button
        const removeAllBtn = document.getElementById('remove-all-tags-btn');
        if (removeAllBtn) {
            removeAllBtn.textContent = 'Remove All Tags';
            removeAllBtn.style.backgroundColor = '#f44336'; // Red for remove
        }

        const originalTags = new Set();
        allSelectedImageIds.forEach(imageId => {
            const image = libraryImages.find(img => img.id === imageId);
            if (image && image.tags) {
                image.tags.forEach(tag => originalTags.add(tag));
            }
        });

        const sortedTags = Array.from(originalTags).sort();
        const tagCount = sortedTags.length;
        console.log('[FRONTEND] Found', tagCount, 'unique tags across selected images');

        // Update modal header with tag count
        const updateTagHeader = document.querySelector('#update-tag-modal h2');
        if (updateTagHeader) {
            updateTagHeader.textContent = `Mass Update Tags {#${tagCount}}`;
        }

        // Populate selected images
        try {
            populateSelectedImagesList();
        } catch (error) {
            console.error('[FRONTEND] Error populating selected images list:', error);
        }

        // Populate original tags list with X buttons based on selection count
        try {
            populateOriginalTagsList(sortedTags);
        } catch (error) {
            console.error('[FRONTEND] Error populating original tags list:', error);
        }

        // Clear new tags list and input
        if (newTagsList) {
            newTagsList.innerHTML = '';
        }
        if (newTagInput) {
            newTagInput.value = '';
        }
        if (tagWarning) {
            tagWarning.classList.add('is-hidden');
        }

        // Show modal
        if (!updateTagModal) {
            console.error('[FRONTEND] updateTagModal element not found!');
            alert('Error: Tag update modal element not found. Please refresh the page.');
            return;
        }
        
        updateTagModal.classList.remove('is-hidden');
        console.log('[FRONTEND] Modal shown successfully');
        
        // Render frequency panel
        try {
            renderUpdateTagFreqFloating();
        } catch (error) {
            console.error('[FRONTEND] Error rendering frequency panel:', error);
        }
    }

    function updateTagCount() {
        // Count all tags: original tags (not marked for removal) + new tags
        const originalTagElements = originalTagsList.querySelectorAll('.tag-item-removable:not(.marked-for-removal)');
        const newTagElements = newTagsList.querySelectorAll('.tag-item');
        const totalCount = originalTagElements.length + newTagElements.length;
        
        // Update modal header with tag count
        const updateTagHeader = document.querySelector('#update-tag-modal h2');
        if (updateTagHeader) {
            updateTagHeader.textContent = `Mass Update Tags {#${totalCount}}`;
        }
    }

    function populateSelectedImagesList() {
        selectedImagesList.innerHTML = '';

        // Include both manually selected and tag-selected images
        const allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];

        if (allSelectedImageIds.length === 0) {
            const empty = document.createElement('div');
            empty.style.color = '#ccc';
            empty.style.padding = '10px';
            empty.textContent = 'No images selected';
            selectedImagesList.appendChild(empty);
            return;
        }

        allSelectedImageIds.forEach(imageId => {
            const image = libraryImages.find(img => img.id === imageId);
            if (!image) return;

            const imageSrc = `${API_URL}/${image.filepath.replace(/\\/g, '/')}`;

            // Create image container
            const imageContainer = document.createElement('div');
            imageContainer.className = 'update-tag-image-item';
            imageContainer.style.marginBottom = '10px';
            imageContainer.style.display = 'flex';
            imageContainer.style.alignItems = 'center';
            imageContainer.style.gap = '10px';
            imageContainer.style.padding = '5px';
            imageContainer.style.border = '1px solid #ddd';
            imageContainer.style.borderRadius = '4px';

            // Create thumbnail
            const thumbnail = document.createElement('img');
            thumbnail.src = imageSrc;
            thumbnail.style.width = '60px';
            thumbnail.style.height = '60px';
            thumbnail.style.objectFit = 'cover';
            thumbnail.style.borderRadius = '4px';
            thumbnail.style.flexShrink = '0';
            thumbnail.onerror = function() {
                this.style.backgroundColor = '#f0f0f0';
                this.style.display = 'flex';
                this.style.alignItems = 'center';
                this.style.justifyContent = 'center';
                this.textContent = 'No image';
            };

            // Create image info
            const imageInfo = document.createElement('div');
            imageInfo.style.flex = '1';
            imageInfo.style.minWidth = '0';

            const imageIdText = document.createElement('div');
            imageIdText.textContent = `ID: ${image.id}`;
            imageIdText.style.fontSize = '12px';
            imageIdText.style.color = '#666';
            imageIdText.style.marginBottom = '4px';

            const tagsCount = document.createElement('div');
            const tagCount = (image.tags || []).length;
            tagsCount.textContent = `${tagCount} tag${tagCount !== 1 ? 's' : ''}`;
            tagsCount.style.fontSize = '11px';
            tagsCount.style.color = '#999';

            imageInfo.appendChild(imageIdText);
            imageInfo.appendChild(tagsCount);

            imageContainer.appendChild(thumbnail);
            imageContainer.appendChild(imageInfo);
            selectedImagesList.appendChild(imageContainer);
        });
    }

    function populateOriginalTagsList(tags) {
        originalTagsList.innerHTML = '';

        // Determine which tags are common to ALL selected images
        const commonTags = getCommonTagsFromSelectedImages();

        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-item-removable';

            const tagText = document.createElement('span');
            tagText.textContent = tag;
            tagElement.appendChild(tagText);

            // Show X button if this tag is common to ALL selected images
            const isCommonTag = commonTags.includes(tag);
            if (isCommonTag) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'tag-remove-btn';
                removeBtn.textContent = '✕';
                removeBtn.onclick = () => removeIndividualTag(tag);
                tagElement.appendChild(removeBtn);
            }

            originalTagsList.appendChild(tagElement);
        });
        
        // Update tag count after populating
        updateTagCount();
    }

    function getCommonTagsFromSelectedImages() {
        // Include both manually selected and tag-selected images
        const allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];
        if (allSelectedImageIds.length === 0) return [];

        // Get tags from first image
        const firstImage = libraryImages.find(img => img.id === allSelectedImageIds[0]);
        if (!firstImage || !firstImage.tags) return [];

        let commonTags = [...firstImage.tags];

        // For each subsequent image, keep only tags that are also in that image
        for (let i = 1; i < allSelectedImageIds.length; i++) {
            const image = libraryImages.find(img => img.id === allSelectedImageIds[i]);
            if (!image || !image.tags) {
                return []; // If any image has no tags, no tags are common
            }
            commonTags = commonTags.filter(tag => image.tags.includes(tag));
        }

        return commonTags;
    }

    function hideUpdateTagModal() {
        updateTagModal.classList.add('is-hidden');
        selectedImagesList.innerHTML = '';
        originalTagsList.innerHTML = '';
        newTagsList.innerHTML = '';
        newTagInput.value = '';
        tagWarning.classList.add('is-hidden');

        // Remove frequency panel
        const freqPanel = document.getElementById('update-tag-freq-floating');
        if (freqPanel) freqPanel.remove();

        // Reset state
        tagsToRemove.clear();
        removeAllTags = false;
        tagsToAdd.clear();

        // Reset Remove All Tags button
        const removeAllBtn = document.getElementById('remove-all-tags-btn');
        removeAllBtn.textContent = 'Remove All Tags';
        removeAllBtn.style.backgroundColor = '#f44336'; // Red for remove

        // Hide success modal if visible
        tagUpdateSuccessModal.classList.add('is-hidden');
    }

    function removeIndividualTag(tag) {
        const tagElements = originalTagsList.querySelectorAll('.tag-item-removable');
        const tagElement = Array.from(tagElements).find(element =>
            element.querySelector('span').textContent === tag
        );

        if (!tagElement) return;

        // Toggle removal state
        if (tagsToRemove.has(tag)) {
            // Currently marked for removal - undo it
            console.log('Unmarking tag for removal:', tag);
            tagsToRemove.delete(tag);
            tagElement.classList.remove('marked-for-removal');
        } else {
            // Not marked for removal - mark it
            console.log('Marking tag for removal:', tag);
            tagsToRemove.add(tag);
            tagElement.classList.add('marked-for-removal');
        }
        
        // Update tag count after removal state change
        updateTagCount();
        renderUpdateTagFreqFloating(); // Re-render frequency panel to update disabled state
    }

    function removeAllTagsFromSelected() {
        const removeAllBtn = document.getElementById('remove-all-tags-btn');

        if (!removeAllTags) {
            // Mark all tags for removal
            console.log('Marking all tags for removal');
            removeAllTags = true;
            removeAllBtn.textContent = 'Undo Remove All';
            removeAllBtn.style.backgroundColor = '#ff9800'; // Orange for undo

            // Visual feedback - dim all tags
            const tagElements = originalTagsList.querySelectorAll('.tag-item-removable');
            tagElements.forEach(element => {
                element.classList.add('marked-for-removal');
            });
        } else {
            // Undo remove all tags
            console.log('Undoing remove all tags');
            removeAllTags = false;
            removeAllBtn.textContent = 'Remove All Tags';
            removeAllBtn.style.backgroundColor = '#f44336'; // Red for remove

            // Remove visual feedback
            const tagElements = originalTagsList.querySelectorAll('.tag-item-removable');
            tagElements.forEach(element => {
                element.classList.remove('marked-for-removal');
            });
        }
        
        // Update tag count after remove all/undo
        updateTagCount();
        renderUpdateTagFreqFloating(); // Re-render frequency panel to update disabled state
    }

    function addNewTags() {
        const inputValue = newTagInput.value.trim();

        if (!inputValue) {
            tagWarning.classList.remove('is-hidden');
            setTimeout(() => {
                tagWarning.classList.add('is-hidden');
            }, 3000);
            return;
        }

        tagWarning.classList.add('is-hidden');

        // Split by comma and clean up tags
        const newTags = inputValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        newTags.forEach(tag => {
            if (!tagsToAdd.has(tag)) {
                tagsToAdd.add(tag);

                // Add to visual list with X button
                const tagElement = document.createElement('div');
                tagElement.className = 'tag-item tag-item-removable';

                const tagText = document.createElement('span');
                tagText.textContent = tag;
                tagElement.appendChild(tagText);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'tag-remove-btn';
                removeBtn.textContent = '×';
                removeBtn.onclick = () => removeNewTag(tag, tagElement);
                tagElement.appendChild(removeBtn);

                newTagsList.appendChild(tagElement);
            }
        });

        // Clear input
        newTagInput.value = '';
        updateTagCount(); // Update count after adding new tags
        renderUpdateTagFreqFloating(); // Re-render frequency panel to update disabled state
    }

    function removeNewTag(tag, tagElement) {
        console.log('Removing new tag:', tag);
        tagsToAdd.delete(tag);
        tagElement.remove();
        updateTagCount(); // Update count when tag is removed
        renderUpdateTagFreqFloating(); // Re-render frequency panel
    }

    // Render floating frequency panel in update tag modal
    function renderUpdateTagFreqFloating() {
        const modal = updateTagModal;
        if (!modal || modal.classList.contains('is-hidden')) return;
        
        // Remove existing frequency panel
        const existing = document.getElementById('update-tag-freq-floating');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'update-tag-freq-floating';
        panel.className = 'lightbox-freq-floating';

        const header = document.createElement('h4');
        const headerText = document.createElement('span');
        headerText.textContent = 'Frequently used';
        header.appendChild(headerText);
        
        const sortBtn = document.createElement('button');
        sortBtn.className = 'button is-small';
        sortBtn.type = 'button';
        sortBtn.textContent = updateTagFreqSortMode === 'alphabetical' ? 'Freq' : 'A-Z';
        sortBtn.title = updateTagFreqSortMode === 'alphabetical' ? 'Sort by Frequency' : 'Sort A-Z';
        sortBtn.addEventListener('click', () => {
            updateTagFreqSortMode = updateTagFreqSortMode === 'frequency' ? 'alphabetical' : 'frequency';
            renderUpdateTagFreqFloating(); // Re-render with new sort mode
        });
        header.appendChild(sortBtn);
        panel.appendChild(header);

        const list = document.createElement('div');
        list.className = 'lightbox-freq-list';

        const freqItems = Object.entries(subjFreqMap)
            .map(([label, count]) => ({ label, count }));
        
        if (updateTagFreqSortMode === 'alphabetical') {
            freqItems.sort((a, b) => a.label.localeCompare(b.label));
        } else {
            // Default: sort by count desc, then label asc
            freqItems.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        }

        if (freqItems.length === 0) {
            const empty = document.createElement('div');
            empty.style.color = '#ccc';
            empty.textContent = 'No frequent tags yet';
            list.appendChild(empty);
        } else {
            // Get all existing tags (original tags not marked for removal + new tags)
            const originalTagElements = originalTagsList.querySelectorAll('.tag-item-removable:not(.marked-for-removal)');
            const originalTags = Array.from(originalTagElements).map(el => el.querySelector('span').textContent);
            const existingTags = new Set([...originalTags, ...Array.from(tagsToAdd)]);
            
            freqItems.forEach(({ label, count }) => {
                const row = document.createElement('div');
                row.className = 'lightbox-freq-item';
                const nameSpan = document.createElement('span');
                nameSpan.textContent = label;
                const countSpan = document.createElement('span');
                countSpan.textContent = `×${count}`;
                row.appendChild(nameSpan);
                row.appendChild(countSpan);
                
                const isUsed = Array.from(existingTags).some(t => t.toLowerCase() === label.toLowerCase());
                if (isUsed) {
                    row.classList.add('disabled');
                }
                
                row.addEventListener('click', () => {
                    if (row.classList.contains('disabled')) {
                        return; // Tag already added, do nothing
                    }
                    // Add tag to tagsToAdd
                    addTagFromFrequency(label);
                });
                list.appendChild(row);
            });
        }

        panel.appendChild(list);
        modal.appendChild(panel);
    }

    // Add tag from frequency panel to new tags
    function addTagFromFrequency(tagText) {
        if (tagsToAdd.has(tagText)) {
            return; // Already added
        }
        
        tagsToAdd.add(tagText);

        // Add to visual list with X button
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item tag-item-removable';

        const tagTextSpan = document.createElement('span');
        tagTextSpan.textContent = tagText;
        tagElement.appendChild(tagTextSpan);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'tag-remove-btn';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => removeNewTag(tagText, tagElement);
        tagElement.appendChild(removeBtn);

        newTagsList.appendChild(tagElement);
        updateTagCount();
        renderUpdateTagFreqFloating(); // Re-render to update disabled state
    }

    function showTagUpdateSuccess() {
        // Show success modal
        tagUpdateSuccessModal.classList.remove('is-hidden');
    }

    function hideTagUpdateSuccess() {
        tagUpdateSuccessModal.classList.add('is-hidden');
    }

    function showTagRemovalNotification(tagText, deselectedCount) {
        // Update the message with specific details
        tagRemovalMessage.textContent = `Tag "${tagText}" removed and ${deselectedCount} image${deselectedCount !== 1 ? 's' : ''} deselected!`;

        // Show the notification modal
        tagRemovalNotificationModal.classList.remove('is-hidden');

        // Auto-hide after 3 seconds
        setTimeout(() => {
            hideTagRemovalNotification();
        }, 3000);
    }

    function hideTagRemovalNotification() {
        tagRemovalNotificationModal.classList.add('is-hidden');
    }

    // Tag Removal Confirmation Functions
    function showTagRemovalConfirmation(tagText) {
        // Count how many images have this tag from both selected and tag-selected images
        const imagesWithTag = [];
        const allSelectedImages = [...new Set([...selectedImages, ...tagSelectedImages])];

        allSelectedImages.forEach(imageId => {
            const image = libraryImages.find(img => img.id === imageId);
            if (image && image.tags && image.tags.includes(tagText)) {
                imagesWithTag.push(imageId);
            }
        });

        // Update modal content
        tagRemovalTagName.textContent = tagText;
        tagRemovalImageCount.textContent = imagesWithTag.length;

        // Store tag for removal action
        tagRemovalConfirmModal.dataset.tagToRemove = tagText;

        // Show modal
        tagRemovalConfirmModal.classList.remove('is-hidden');
    }

    function hideTagRemovalConfirmModal() {
        tagRemovalConfirmModal.classList.add('is-hidden');
        delete tagRemovalConfirmModal.dataset.tagToRemove;
    }

    function confirmTagRemoval() {
        const tagToRemove = tagRemovalConfirmModal.dataset.tagToRemove;
        if (tagToRemove) {
            // Hide confirmation modal first
            hideTagRemovalConfirmModal();

            // Remove the tag and clear its selected images
            if (isPoolView) {
                // In Selection Pool, preserve pool view behavior
                removeSearchTagChipInPoolView(tagToRemove);
            } else {
                // In Library view, remove chip and refresh highlights
                removeSearchTagChip(tagToRemove);
            }
        }
    }

    // Clear All Confirmation Functions
    async function showClearAllConfirmation() {
        // Count current selections and tags (considering AND/OR mode)
        const uniqueSelections = await calculateSelectionCount();
        const totalTags = searchTags.length;

        // Update modal content
        clearAllSelectionCount.textContent = uniqueSelections;
        clearAllTagCount.textContent = totalTags;

        // Show modal
        clearAllConfirmModal.classList.remove('is-hidden');
    }

    function hideClearAllConfirmModal() {
        clearAllConfirmModal.classList.add('is-hidden');
    }

    function confirmClearAll() {
        // Hide confirmation modal first
        hideClearAllConfirmModal();

        // Execute the clear all action
        clearAllSearchChips();
    }


    async function saveTagUpdates() {
        console.log('=== SAVE TAG UPDATES START ===');
        // Include both manually selected and tag-selected images
        const allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];
        console.log('Selected images:', allSelectedImageIds);
        console.log('Selected images count:', allSelectedImageIds.length);
        console.log('Tags to remove:', Array.from(tagsToRemove));
        console.log('Remove all tags:', removeAllTags);
        console.log('Tags to add:', Array.from(tagsToAdd));

        // Check if there are any changes
        if (!removeAllTags && tagsToRemove.size === 0 && tagsToAdd.size === 0) {
            console.log('No changes to save');
            hideUpdateTagModal();
            return;
        }

        try {
            let successCount = 0;
            let errorCount = 0;
            const updateResults = [];

            // Process each selected image
            for (const imageId of allSelectedImageIds) {
                try {
                    console.log(`--- Processing image ${imageId} ---`);
                    const image = libraryImages.find(img => img.id === imageId);
                    if (!image) {
                        console.warn(`Image ${imageId} not found in libraryImages`);
                        continue;
                    }

                    const originalTags = image.tags ? [...image.tags] : [];
                    console.log(`Original tags for image ${imageId}:`, originalTags);

                    let currentTags = [...originalTags];

                    // Handle tag removal
                    if (removeAllTags) {
                        currentTags = [];
                        console.log(`Removing all tags from image ${imageId}`);
                    } else {
                        // Remove individual tags
                        tagsToRemove.forEach(tagToRemove => {
                            const beforeLength = currentTags.length;
                            currentTags = currentTags.filter(tag => tag !== tagToRemove);
                            const afterLength = currentTags.length;
                            if (beforeLength !== afterLength) {
                                console.log(`Removed tag "${tagToRemove}" from image ${imageId}`);
                            }
                        });
                    }

                    // Add new tags
                    tagsToAdd.forEach(tagToAdd => {
                        if (!currentTags.includes(tagToAdd)) {
                            currentTags.push(tagToAdd);
                            console.log(`Added tag "${tagToAdd}" to image ${imageId}`);
                        }
                    });

                    console.log(`Final tags for image ${imageId}:`, currentTags);

                    // Update the image in backend
                    await updateImageTags(imageId, currentTags);

                    // Update local image object
                    image.tags = currentTags;

                    successCount++;
                    updateResults.push({ imageId, status: 'success', tags: currentTags });
                    console.log(`✓ Successfully updated image ${imageId}`);

                } catch (imageError) {
                    errorCount++;
                    updateResults.push({ imageId, status: 'error', error: imageError.message });
                    console.error(`✗ Failed to update image ${imageId}:`, imageError);
                }
            }

            console.log('=== UPDATE SUMMARY ===');
            console.log(`Total images processed: ${allSelectedImageIds.length}`);
            console.log(`Successful updates: ${successCount}`);
            console.log(`Failed updates: ${errorCount}`);
            console.log('Update results:', updateResults);

            if (errorCount > 0) {
                console.warn(`${errorCount} images failed to update. Check the logs above for details.`);
                alert(`Warning: ${errorCount} out of ${allSelectedImageIds.length} images failed to update. Check the browser console for details.`);
            }

            console.log('Tag updates completed. Refreshing display...');

            // Update frequency for tags that were added via mass update
            // 1. Add tags to frequently used tags database (if not already there)
            // 2. Increment frequency count by number of images in selection pool
            //    (if tag already exists, add to existing count; if new, set to number of images)
            const tagsAdded = Array.from(tagsToAdd);
            if (tagsAdded.length > 0) {
                const numberOfImages = allSelectedImageIds.length;
                console.log(`[FRONTEND] Updating frequency for ${tagsAdded.length} tag(s) across ${numberOfImages} image(s)`);
                
                // The backend increments by 1 per unique tag in the array
                // To increment by N (number of images), we need to call the API N times
                // OR send the tag N times, but backend deduplicates, so we call N times
                for (let i = 0; i < numberOfImages; i++) {
                    // Call once per image - this will increment each tag by 1
                    // After N calls, each tag will be incremented by N (number of images)
                    await persistFeelingsUsage(tagsAdded);
                }
                
                console.log(`[FRONTEND] Called persistFeelingsUsage ${numberOfImages} times for ${tagsAdded.length} tag(s)`);
                await fetchSubjFrequencies();
                console.log(`[FRONTEND] Frequency updated successfully - each tag incremented by ${numberOfImages}`);
            }

            // Refresh the library display
            await displayLibraryImages();

            // Close update tag modal first
            hideUpdateTagModal();

            // Show success modal
            showTagUpdateSuccess();

            console.log('=== SAVE TAG UPDATES END ===');

        } catch (error) {
            console.error('Critical error during tag updates:', error);
            alert('Failed to update tags. Please try again.');
        }
    }

    // Helper function to update tags in all relevant image arrays
    function updateImageTagsInMemory(imageId, tags) {
        // Update in libraryImages array
        const imageInLibrary = libraryImages.find(img => img.id === imageId);
        if (imageInLibrary) {
            imageInLibrary.tags = tags;
        }
        
        // Update in allImagesToDisplay array (used by selection pool)
        const imageInDisplay = allImagesToDisplay.find(img => img.id === imageId);
        if (imageInDisplay) {
            imageInDisplay.tags = tags;
        }
        
        console.log(`Updated tags in memory for image ${imageId}`);
    }

    async function updateImageTags(imageId, tags) {
        if (!imageId || isNaN(imageId)) {
            throw new Error(`Invalid image ID: ${imageId}`);
        }
        
        console.log(`Updating tags for image ${imageId}:`, tags);
        console.log(`Making PUT request to: ${API_URL}/images/${imageId}/tags`);

        try {
            const sessionToken = localStorage.getItem('sessionToken');
            if (!sessionToken) {
                console.warn('No session token found - request may fail if authentication is required');
            }
            const headers = {
                'Content-Type': 'application/json',
            };
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            const response = await fetch(`${API_URL}/images/${imageId}/tags`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ tags: tags })
            });

            console.log(`Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                let errorText;
                try {
                    errorText = await response.text();
                    // Try to parse as JSON if possible
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorText = errorJson.error || errorJson.message || errorText;
                    } catch (e) {
                        // Not JSON, use as-is
                    }
                } catch (e) {
                    errorText = `HTTP ${response.status} ${response.statusText}`;
                }
                console.error(`Server error response:`, errorText);
                throw new Error(`Failed to update tags: ${response.status} ${response.statusText} - ${errorText}`);
            }

            let result;
            try {
                const responseText = await response.text();
                if (responseText) {
                    result = JSON.parse(responseText);
                } else {
                    result = { success: true };
                }
            } catch (parseError) {
                console.warn('Failed to parse response as JSON, treating as success');
                result = { success: true };
            }
            console.log(`Successfully updated tags for image ${imageId}:`, result);
            
            // Update tags in all memory arrays after successful API call
            updateImageTagsInMemory(imageId, tags);
            
            return result;
        } catch (error) {
            console.error(`Network or parsing error for image ${imageId}:`, error);
            // Re-throw with more context
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error(`Network error: Unable to connect to server. Please check if the server is running at ${API_URL}`);
            }
            throw error;
        }
    }

    // Delete Image Functions
    async function showDeleteImageModal() {
        // Count selections considering AND/OR mode
        const totalSelected = await calculateSelectionCount();
        deleteCount.textContent = totalSelected;
        deleteImageModal.classList.remove('is-hidden');
    }

    function hideDeleteImageModal() {
        deleteImageModal.classList.add('is-hidden');
    }

    async function deleteSelectedImages() {
        try {
            // Get all selected image IDs (both manual and tag-selected)
            const allSelectedIds = [...new Set([...selectedImages, ...tagSelectedImages])];

            if (allSelectedIds.length === 0) {
                alert('No images selected for deletion.');
                return;
            }

            console.log(`Deleting ${allSelectedIds.length} images:`, allSelectedIds);

            // Delete each image
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            for (const imageId of allSelectedIds) {
                const response = await fetch(`${API_URL}/images/${imageId}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to delete image ${imageId}:`, errorText);
                    console.error(`Response status: ${response.status}, Status text: ${response.statusText}`);
                    throw new Error(`Failed to delete image ${imageId}: ${response.status} ${response.statusText} - ${errorText}`);
                }

                console.log(`Successfully deleted image ${imageId}`);
            }

            // Clear all selections
            selectedImages = [];
            tagSelectedImages = [];
            imageSelectionSource = {};
            imageSelectionOrder = {};

            // Hide delete modal
            hideDeleteImageModal();

            // Return to library view with zero selections
            showingSelectionPool = false;
            isPoolView = false;

            // Refresh the library display
            await displayLibraryImages();

            console.log(`Successfully deleted ${allSelectedIds.length} images and returned to library`);

        } catch (error) {
            console.error('Error deleting images:', error);
            alert('Failed to delete some images. Please try again.');
        }
    }

    async function shareProject() {
        const email = shareEmailInput.value.trim();
        const message = shareMessageInput.value.trim();
        const projectId = shareProjectModal.dataset.projectId;
        const projectName = shareProjectModal.dataset.projectName;

        if (!email) {
            alert('Please enter a recipient email address.');
            shareEmailInput.focus();
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            alert('Please enter a valid email address.');
            shareEmailInput.focus();
            return;
        }

        // Show loading state and overlay
        sendShareBtn.disabled = true;
        sendShareBtn.textContent = 'Sending...';
        hideShareProjectModal();
        emailSendingOverlay.classList.remove('is-hidden');

        try {
            // Get the project data to include breakdown in email
            const project = projects.find(p => p.id == projectId);
            const breakdownText = formatSelectionBreakdown(project?.selection_breakdown, project);

            // Collect all subjective tags (feeling tags) from project images
            const allSubjectiveTags = new Set();
            if (project && project.image_ids) {
                try {
                    const sessionToken = localStorage.getItem('sessionToken');
                    const headers = {};
                    if (sessionToken) {
                        headers['Authorization'] = `Bearer ${sessionToken}`;
                    }
                    const response = await fetch(`${API_URL}/images`, { headers });
                    if (response.ok) {
                        const allImages = await response.json();
                        const projectImages = allImages.filter(img => project.image_ids.includes(img.id));
                        
                        projectImages.forEach(image => {
                            if (image.tags && Array.isArray(image.tags)) {
                                image.tags.forEach(tag => {
                                    // Only include subjective tags (exclude objective metadata)
                                    if (!isObjectiveTag(tag)) {
                                        allSubjectiveTags.add(tag);
                                    }
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error fetching images for tag filtering:', error);
                }
            }

            const subjectiveTagsList = Array.from(allSubjectiveTags).sort();

            // Extract project tags - use the SAME logic as project detail modal
            let projectTagsList = [];
            
            // Ensure selection_breakdown exists (regenerate if missing)
            if (project && !project.selection_breakdown) {
                project.selection_breakdown = generateBreakdownFromProject(project);
            }
            
            // Use EXACT same logic as showProjectDetailModal
            // ONLY use the user's original search tags from selection_breakdown
            if (project && project.selection_breakdown) {
                if (project.selection_breakdown.searchTags && Array.isArray(project.selection_breakdown.searchTags) && project.selection_breakdown.searchTags.length > 0) {
                    projectTagsList = project.selection_breakdown.searchTags;
                } else if (project.selection_breakdown.tagCounts && typeof project.selection_breakdown.tagCounts === 'object') {
                    const tagCountsKeys = Object.keys(project.selection_breakdown.tagCounts);
                    if (tagCountsKeys.length > 0) {
                        projectTagsList = tagCountsKeys;
                    }
                }
            }

            // DO NOT collect all image tags as fallback - only show user's search tags
            console.log('Project tags for email (user search tags only):', projectTagsList);
            
            // Get search mode from selection_breakdown, default to 'OR' if not available
            let searchMode = 'OR';
            if (project && project.selection_breakdown && project.selection_breakdown.searchMode) {
                searchMode = project.selection_breakdown.searchMode;
            }
            
            console.log('Project tags for email:', projectTagsList);
            console.log('Search mode for email:', searchMode);

            console.log('=== EMAIL SHARING ===');
            console.log('Project for email:', project);
            console.log('Breakdown text being sent:', breakdownText);
            console.log('Subjective tags only:', subjectiveTagsList);
            console.log('Project tags:', projectTagsList);

            const emailData = {
                recipient_email: email,
                message: message,
                breakdown_text: breakdownText,  // Send formatted breakdown to backend
                include_only_feelings: true,  // Only show "Add feelings:" section, hide objective facts and tags
                subjective_tags: subjectiveTagsList,  // Send only subjective/feeling tags (e.g., "spider", "ghost spider", "clara")
                project_tags: projectTagsList,  // Send project-level tags (e.g., "clara")
                search_mode: searchMode  // Send search mode (OR/AND)
            };

            console.log('Email data being sent to backend:', emailData);

            const sessionToken = localStorage.getItem('sessionToken');
            if (!sessionToken) {
                throw new Error('Not authenticated. Please log in again.');
            }

            const response = await fetch(`${API_URL}/projects/${projectId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify(emailData)
            });

            if (response.status === 401 || response.status === 403) {
                throw new Error('Not authorized. Please log in again.');
            }

            if (response.ok) {
                emailSendingOverlay.classList.add('is-hidden');
                alert(`Project "${projectName}" has been shared successfully with ${email}!`);

                // Refresh email history displays immediately
                await refreshEmailHistoryDisplays(projectId);
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to share project');
            }
        } catch (error) {
            console.error('Error sharing project:', error);
            emailSendingOverlay.classList.add('is-hidden');
            alert(error.message || 'Failed to share project. Please try again.');
        } finally {
            // Reset button state
            sendShareBtn.disabled = false;
            sendShareBtn.textContent = 'Send Email';
            emailSendingOverlay.classList.add('is-hidden');
        }
    }

    // --- Event Listeners ---

    navLinks.library.addEventListener('click', (e) => { e.preventDefault(); navigateTo('library'); });
    navLinks.upload.addEventListener('click', (e) => { e.preventDefault(); navigateTo('upload'); });
    navLinks['upload-pattern'].addEventListener('click', (e) => { e.preventDefault(); navigateTo('upload-pattern'); });
    navLinks.project.addEventListener('click', (e) => { e.preventDefault(); navigateTo('project'); });
    navLinks['pattern-apply'].addEventListener('click', (e) => { e.preventDefault(); navigateTo('pattern-apply'); });
    if (navLinks.admin) {
        navLinks.admin.addEventListener('click', (e) => { 
            e.preventDefault(); 
            if (hasAdminPrivileges()) {
                navigateTo('admin'); 
            } else {
                alert('Admin or level 3 access required');
            }
        });
    }

    // Initialize: Load images when page first loads (if library page is visible)
    if (pages.library && !pages.library.classList.contains('is-hidden')) {
        console.log('Initial page load - loading library images');
        displayLibraryImages().catch(error => {
            console.error('Error loading images on initial page load:', error);
        });
    }

    // Always fetch persisted feeling frequencies on page load (refresh-safe)
    fetchSubjFrequencies();

    // Broken image notification dismiss
    document.getElementById('dismiss-notification').addEventListener('click', () => {
        // Hide notification immediately
        document.getElementById('broken-image-notification').classList.add('hidden');

        // Set persistent dismissal flag so it won't show again
        brokenImageNotificationDismissed = true;
        localStorage.setItem('brokenImageNotificationDismissed', 'true');

        console.log('Broken image notification dismissed permanently');
    });

    fileInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
    });

    clearAllButton.addEventListener('click', () => {
        previewGrid.innerHTML = '';
        filesToUpload = [];
        fileInput.value = '';
        // Remove single-image class when all images are cleared
        if (dropzone) {
            dropzone.classList.remove('single-image');
        }
    });

    // Autocomplete state for feelings input
    let subjAutocompleteVisible = false;
    let subjAutocompleteItems = [];
    let subjAutocompleteHighlightIndex = -1;

    // Show autocomplete suggestions based on input
    function showSubjAutocomplete(inputValue) {
        if (!subjAutocompleteDropdown || !inputValue || inputValue.trim().length === 0) {
            hideSubjAutocomplete();
            return;
        }

        const inputLower = inputValue.toLowerCase().trim();
        const existingTags = Array.from(subjChips.querySelectorAll('.chip')).map(c =>
            c.textContent.replace(/[×x]$/, '').trim().toLowerCase()
        );

        // Find matching frequently used tags
        const matchingTags = Object.keys(subjFreqMap)
            .filter(tag => {
                const tagLower = tag.toLowerCase();
                // Check if input is similar to tag (partial match)
                return tagLower.includes(inputLower) || inputLower.includes(tagLower);
            })
            .filter(tag => !existingTags.includes(tag.toLowerCase())) // Exclude already added tags
            .sort((a, b) => {
                // Sort by relevance: exact matches first, then by frequency
                const aExact = a.toLowerCase() === inputLower;
                const bExact = b.toLowerCase() === inputLower;
                if (aExact !== bExact) return aExact ? -1 : 1;
                return subjFreqMap[b] - subjFreqMap[a]; // Higher frequency first
            })
            .slice(0, 5); // Limit to 5 suggestions

        if (matchingTags.length === 0) {
            hideSubjAutocomplete();
            return;
        }

        subjAutocompleteItems = matchingTags;
        subjAutocompleteHighlightIndex = -1;

        // Build dropdown HTML
        subjAutocompleteDropdown.innerHTML = '';
        matchingTags.forEach((tag, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = tag;
            item.dataset.tag = tag;
            item.addEventListener('click', () => {
                selectSubjAutocompleteItem(tag);
            });
            subjAutocompleteDropdown.appendChild(item);
        });

        subjAutocompleteDropdown.classList.add('show');
        subjAutocompleteVisible = true;
    }

    function hideSubjAutocomplete() {
        if (subjAutocompleteDropdown) {
            subjAutocompleteDropdown.classList.remove('show');
            subjAutocompleteVisible = false;
            subjAutocompleteItems = [];
            subjAutocompleteHighlightIndex = -1;
        }
    }

    function selectSubjAutocompleteItem(tag) {
        addSubjChip(tag);
        subjInput.value = '';
        hideSubjAutocomplete();
        subjInput.focus();
    }

    // Input event listener for autocomplete
    subjInput.addEventListener('input', (e) => {
        const value = e.target.value;
        showSubjAutocomplete(value);
    });

    // Keyboard navigation for autocomplete
    subjInput.addEventListener('keydown', (e) => {
        if (subjAutocompleteVisible && subjAutocompleteItems.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                subjAutocompleteHighlightIndex = Math.min(
                    subjAutocompleteHighlightIndex + 1,
                    subjAutocompleteItems.length - 1
                );
                updateSubjAutocompleteHighlight();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                subjAutocompleteHighlightIndex = Math.max(subjAutocompleteHighlightIndex - 1, -1);
                updateSubjAutocompleteHighlight();
            } else if (e.key === 'Enter' && subjAutocompleteHighlightIndex >= 0) {
                e.preventDefault();
                const selectedTag = subjAutocompleteItems[subjAutocompleteHighlightIndex];
                selectSubjAutocompleteItem(selectedTag);
                return;
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideSubjAutocomplete();
                return;
            }
        }

        if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
            e.preventDefault();
            handleSubjCommit();
            hideSubjAutocomplete();
        }
    });

    function updateSubjAutocompleteHighlight() {
        const items = subjAutocompleteDropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('highlighted', index === subjAutocompleteHighlightIndex);
        });
    }

    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (subjAutocompleteDropdown && !subjAutocompleteDropdown.contains(e.target) && 
            e.target !== subjInput && !subjInput.contains(e.target)) {
            hideSubjAutocomplete();
        }
    });

    // Add event listeners for all objective metadata inputs
    [objBookInput, objPageInput, objRowInput, objColumnInput, objTypeInput, objMaterialInput, objWidthInput, objLengthInput, objRemarkInput, objBrandInput, objColorInput].forEach(input => {
        if (input) {
            input.addEventListener('keydown', (e) => {
                // Special handling for width and length inputs - Tab should move focus without clearing
                if ((input === objWidthInput || input === objLengthInput) && e.key === 'Tab') {
                    // Allow Tab to work normally (move to next field) without clearing input
                    // Only commit if Enter or comma is pressed
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleObjCommit(input);
                    }
                    // Tab key will work normally (no preventDefault)
                    return;
                }
                
                if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
                    e.preventDefault();
                    handleObjCommit(input);
                }
            });
        }
    });

    // Auto-fill button event listener
    autoFillBtn.addEventListener('click', autoFillMetadata);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('is-dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('is-dragover'), false);
    });
    dropzone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    }, false);

    window.addEventListener('paste', (e) => {
        if (pages.upload.classList.contains('is-hidden')) return;
        handleFiles(e.clipboardData.files);
        dropzone.classList.add('is-dragover');
        setTimeout(() => dropzone.classList.remove('is-dragover'), 150);
    });

    prevButton.addEventListener('click', () => {
        if (libraryImages.length > 0) {
            showLibraryImage(currentImageIndex - 1);
        } else {
            showImage(currentImageIndex - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (libraryImages.length > 0) {
            showLibraryImage(currentImageIndex + 1);
        } else {
            showImage(currentImageIndex + 1);
        }
    });

    closeModal.addEventListener('click', hideModal);


    // Add keyboard support for Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!modal.classList.contains('is-hidden')) {
                hideModal();
            } else if (!tagRemovalConfirmModal.classList.contains('is-hidden')) {
                hideTagRemovalConfirmModal();
            } else if (!clearAllConfirmModal.classList.contains('is-hidden')) {
                hideClearAllConfirmModal();
            } else if (feelingsWarningModal && !feelingsWarningModal.classList.contains('is-hidden')) {
                feelingsWarningModal.classList.add('is-hidden');
                if (subjInput) {
                    subjInput.focus();
                }
            } else if (noImagesWarningModal && !noImagesWarningModal.classList.contains('is-hidden')) {
                noImagesWarningModal.classList.add('is-hidden');
                if (fileInput) {
                    fileInput.click();
                }
            } else if (dimensionWarningModal && !dimensionWarningModal.classList.contains('is-hidden')) {
                dimensionWarningModal.classList.add('is-hidden');
                if (objWidthInput) {
                    objWidthInput.focus();
                }
            } else if (patternNoImagesWarningModal && !patternNoImagesWarningModal.classList.contains('is-hidden')) {
                patternNoImagesWarningModal.classList.add('is-hidden');
            } else if (patternNoNameWarningModal && !patternNoNameWarningModal.classList.contains('is-hidden')) {
                patternNoNameWarningModal.classList.add('is-hidden');
                if (patternNameInput) {
                    patternNameInput.focus();
                }
            } else if (patternDuplicateNameWarningModal && !patternDuplicateNameWarningModal.classList.contains('is-hidden')) {
                patternDuplicateNameWarningModal.classList.add('is-hidden');
                if (patternNameInput) {
                    patternNameInput.focus();
                    patternNameInput.select();
                }
            } else if (patternUploadSuccessModal && !patternUploadSuccessModal.classList.contains('is-hidden')) {
                patternUploadSuccessModal.classList.add('is-hidden');
            } else if (patternUploadErrorModal && !patternUploadErrorModal.classList.contains('is-hidden')) {
                patternUploadErrorModal.classList.add('is-hidden');
            } else if (deletePatternConfirmModal && !deletePatternConfirmModal.classList.contains('is-hidden')) {
                deletePatternConfirmModal.classList.add('is-hidden');
                delete deletePatternConfirmModal.dataset.patternId;
                delete deletePatternConfirmModal.dataset.patternName;
            }
        }
    });

    const loadingOverlay = document.getElementById('loading-overlay');
    const confirmModal = document.getElementById('confirm-modal');
    const uploadMoreBtn = document.getElementById('upload-more-btn');
    const goToLibraryBtn = document.getElementById('go-to-library-btn');
    const feelingsWarningModal = document.getElementById('feelings-warning-modal');
    const okFeelingsBtn = document.getElementById('ok-feelings-btn');
    const noImagesWarningModal = document.getElementById('no-images-warning-modal');
    const okNoImagesBtn = document.getElementById('ok-no-images-btn');
    const dimensionWarningModal = document.getElementById('dimension-warning-modal');
    const okDimensionBtn = document.getElementById('ok-dimension-btn');

    function clearUploadUI() {
        previewGrid.innerHTML = '';
        subjChips.innerHTML = '';
        objChips.innerHTML = '';

        // Clear all objective metadata inputs
        [objBookInput, objPageInput, objRowInput, objColumnInput, objTypeInput, objMaterialInput, objWidthInput, objLengthInput, objRemarkInput, objBrandInput, objColorInput].forEach(input => {
            if (input) {
                input.value = '';
            }
        });
        
        // Clear pattern dropdown
        if (patternDropdownText) {
            patternDropdownText.textContent = 'Select Pattern...';
        }
        selectedPatternId = null;
        selectedPatternData = null;
        
        // Hide pattern preview when clearing
        if (selectedPatternPreview) {
            selectedPatternPreview.classList.add('is-hidden');
        }
        
        // Close dropdown menu
        if (patternDropdownMenu) {
            patternDropdownMenu.classList.add('is-hidden');
        }

        filesToUpload = [];
        fileInput.value = '';
    }

    uploadMoreBtn.addEventListener('click', () => {
        confirmModal.classList.add('is-hidden');
        clearUploadUI();
        uploadButton.disabled = false; // Re-enable
        // Refresh persisted frequencies so the next add-more flow shows latest counts
        fetchSubjFrequencies();
    });

    goToLibraryBtn.addEventListener('click', () => {
        confirmModal.classList.add('is-hidden');
        clearUploadUI();
        uploadButton.disabled = false; // Re-enable
        // Refresh persisted frequencies before navigating back to library
        fetchSubjFrequencies();
        navigateTo('library');
    });

    // Handle OK button for feelings warning modal
    if (okFeelingsBtn && feelingsWarningModal) {
        okFeelingsBtn.addEventListener('click', () => {
            feelingsWarningModal.classList.add('is-hidden');
            // Focus on subjective input
            if (subjInput) {
                subjInput.focus();
            }
        });
    }

    // Handle OK button for no images warning modal
    if (okNoImagesBtn && noImagesWarningModal) {
        okNoImagesBtn.addEventListener('click', () => {
            noImagesWarningModal.classList.add('is-hidden');
            // Focus on file input
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    // Handle OK button for dimension warning modal
    if (okDimensionBtn && dimensionWarningModal) {
        okDimensionBtn.addEventListener('click', () => {
            dimensionWarningModal.classList.add('is-hidden');
            // Focus on width input
            if (objWidthInput) {
                objWidthInput.focus();
            }
        });
    }

    // ===== Pattern Upload Functionality =====
    const patternFileInput = document.getElementById('pattern-file-input');
    const patternPreviewGrid = document.getElementById('pattern-preview-grid');
    const patternClearAllButton = document.getElementById('pattern-clear-all');
    const patternDropzone = document.getElementById('pattern-dropzone');
    const patternUploadButton = document.getElementById('pattern-upload-button');
    const patternNameInput = document.getElementById('pattern-name-input');
    const patternNoImagesWarningModal = document.getElementById('pattern-no-images-warning-modal');
    const patternNoNameWarningModal = document.getElementById('pattern-no-name-warning-modal');
    const patternDuplicateNameWarningModal = document.getElementById('pattern-duplicate-name-warning-modal');
    const patternDuplicateNameMessage = document.getElementById('pattern-duplicate-name-message');
    const patternUploadSuccessModal = document.getElementById('pattern-upload-success-modal');
    const patternUploadErrorModal = document.getElementById('pattern-upload-error-modal');
    const patternUploadSuccessMessage = document.getElementById('pattern-upload-success-message');
    const patternUploadErrorMessage = document.getElementById('pattern-upload-error-message');
    const okPatternNoImagesBtn = document.getElementById('ok-pattern-no-images-btn');
    const okPatternNoNameBtn = document.getElementById('ok-pattern-no-name-btn');
    const okPatternDuplicateNameBtn = document.getElementById('ok-pattern-duplicate-name-btn');
    const okPatternUploadSuccessBtn = document.getElementById('ok-pattern-upload-success-btn');
    const okPatternUploadErrorBtn = document.getElementById('ok-pattern-upload-error-btn');
    let patternFilesToUpload = [];

    function handlePatternFiles(files) {
        // Only accept the first file (single file support)
        if (!files || files.length === 0) return;
        
        const file = files[0]; // Only take the first file
        
        // Clear existing files and preview
        if (patternPreviewGrid) patternPreviewGrid.innerHTML = '';
        patternFilesToUpload = [];
        
        // Accept any file type for patterns
        patternFilesToUpload.push(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const card = document.createElement('div');
            card.className = 'preview-card';
            card.dataset.fileName = file.name;

            // Check if it's an image to preview, otherwise show file icon
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
                card.appendChild(img);
            } else {
                const fileIcon = document.createElement('div');
                fileIcon.innerHTML = '📄';
                fileIcon.style.cssText = 'font-size: 48px; text-align: center; padding: 20px;';
                const fileName = document.createElement('div');
                fileName.textContent = file.name;
                fileName.style.cssText = 'text-align: center; margin-top: 10px; font-size: 12px; word-break: break-all; padding: 0 8px;';
                card.appendChild(fileIcon);
                card.appendChild(fileName);
            }

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'delete-btn';
            del.textContent = '×';
            del.addEventListener('click', () => {
                const index = patternFilesToUpload.indexOf(file);
                if (index > -1) {
                    patternFilesToUpload.splice(index, 1);
                }
                card.remove();
            });

            card.appendChild(del);
            if (patternPreviewGrid) patternPreviewGrid.appendChild(card);
        };
        reader.readAsDataURL(file);
    }

    if (patternFileInput) {
        patternFileInput.addEventListener('change', (event) => {
            handlePatternFiles(event.target.files);
        });
    }

    if (patternClearAllButton) {
        patternClearAllButton.addEventListener('click', () => {
            if (patternPreviewGrid) patternPreviewGrid.innerHTML = '';
            patternFilesToUpload = [];
            if (patternFileInput) patternFileInput.value = '';
        });
    }

    if (patternDropzone) {
        patternDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            patternDropzone.classList.add('dragover');
        });

        patternDropzone.addEventListener('dragleave', () => {
            patternDropzone.classList.remove('dragover');
        });

        patternDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            patternDropzone.classList.remove('dragover');
            // Only accept the first file (single file support)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handlePatternFiles(e.dataTransfer.files);
            }
        });

        // Paste support
        document.addEventListener('paste', (e) => {
            // Only handle paste when on pattern upload page
            const patternPage = document.getElementById('page-upload-pattern');
            if (patternPage && !patternPage.classList.contains('is-hidden')) {
                if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
                    // Only accept the first file (single file support)
                    handlePatternFiles(e.clipboardData.files);
                }
            }
        });
    }

    // Handle OK button for pattern no images warning modal
    if (okPatternNoImagesBtn && patternNoImagesWarningModal) {
        okPatternNoImagesBtn.addEventListener('click', () => {
            patternNoImagesWarningModal.classList.add('is-hidden');
        });
    }

    // Handle OK button for pattern no name warning modal
    if (okPatternNoNameBtn && patternNoNameWarningModal) {
        okPatternNoNameBtn.addEventListener('click', () => {
            patternNoNameWarningModal.classList.add('is-hidden');
            // Focus on pattern name input
            if (patternNameInput) {
                patternNameInput.focus();
            }
        });
    }

    // Handle OK button for pattern duplicate name warning modal
    if (okPatternDuplicateNameBtn && patternDuplicateNameWarningModal) {
        okPatternDuplicateNameBtn.addEventListener('click', () => {
            patternDuplicateNameWarningModal.classList.add('is-hidden');
            // Focus on pattern name input and select the text
            if (patternNameInput) {
                patternNameInput.focus();
                patternNameInput.select();
            }
        });
    }

    // Handle OK button for pattern upload success modal
    if (okPatternUploadSuccessBtn && patternUploadSuccessModal) {
        okPatternUploadSuccessBtn.addEventListener('click', () => {
            patternUploadSuccessModal.classList.add('is-hidden');
        });
    }

    // Handle OK button for pattern upload error modal
    if (okPatternUploadErrorBtn && patternUploadErrorModal) {
        okPatternUploadErrorBtn.addEventListener('click', () => {
            patternUploadErrorModal.classList.add('is-hidden');
        });
    }

    // Delete pattern confirmation modal elements
    const deletePatternConfirmModal = document.getElementById('delete-pattern-confirm-modal');
    const deletePatternCancelBtn = document.getElementById('delete-pattern-cancel-btn');
    const deletePatternConfirmBtn = document.getElementById('delete-pattern-confirm-btn');

    // Function to show delete pattern confirmation modal
    function showDeletePatternModal(patternId, patternName) {
        if (!deletePatternConfirmModal) return;
        deletePatternConfirmModal.dataset.patternId = patternId;
        deletePatternConfirmModal.dataset.patternName = patternName;
        deletePatternConfirmModal.classList.remove('is-hidden');
    }

    // Handle cancel button for delete pattern modal
    if (deletePatternCancelBtn && deletePatternConfirmModal) {
        deletePatternCancelBtn.addEventListener('click', () => {
            deletePatternConfirmModal.classList.add('is-hidden');
            delete deletePatternConfirmModal.dataset.patternId;
            delete deletePatternConfirmModal.dataset.patternName;
        });
    }

    // Handle confirm button for delete pattern modal
    if (deletePatternConfirmBtn && deletePatternConfirmModal) {
        deletePatternConfirmBtn.addEventListener('click', async () => {
            const patternId = deletePatternConfirmModal.dataset.patternId;
            if (!patternId) return;

            deletePatternConfirmModal.classList.add('is-hidden');
            
            try {
                const sessionToken = localStorage.getItem('sessionToken');
                const headers = {
                    'Authorization': `Bearer ${sessionToken}`
                };

                const deleteUrl = `${API_URL}/api/patterns/${patternId}`;
                console.log('[Delete Pattern] API_URL:', API_URL);
                console.log('[Delete Pattern] Delete URL:', deleteUrl);
                console.log('[Delete Pattern] Pattern ID:', patternId);
                console.log('[Delete Pattern] Current origin:', window.location.origin);
                
                // Verify API_URL is pointing to port 3000, not 8080
                if (deleteUrl.includes(':8080')) {
                    console.error('[Delete Pattern] ERROR: API_URL is pointing to port 8080 instead of 3000!');
                    throw new Error('API URL is incorrectly configured. Please check server setup.');
                }
                
                const response = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: headers
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to delete pattern');
                }

                // Refresh the pattern thumbnails
                await loadPatternThumbnails();
                // Also reload patterns into dropdown on upload page
                await loadPatternsIntoDropdown();
            } catch (error) {
                console.error('Error deleting pattern:', error);
                // Show error modal
                if (patternUploadErrorMessage && patternUploadErrorModal) {
                    patternUploadErrorMessage.textContent = `Failed to delete pattern. ${error.message || 'Please try again.'}`;
                    patternUploadErrorModal.classList.remove('is-hidden');
                }
            } finally {
                delete deletePatternConfirmModal.dataset.patternId;
                delete deletePatternConfirmModal.dataset.patternName;
            }
        });
    }

    if (patternUploadButton) {
        patternUploadButton.addEventListener('click', async () => {
            // Validate files
            if (patternFilesToUpload.length === 0) {
                if (patternNoImagesWarningModal) {
                    patternNoImagesWarningModal.classList.remove('is-hidden');
                }
                return;
            }

            // Validate pattern name
            const patternName = patternNameInput ? patternNameInput.value.trim() : '';
            if (!patternName) {
                if (patternNoNameWarningModal) {
                    patternNoNameWarningModal.classList.remove('is-hidden');
                }
                return;
            }

            // Check for duplicate pattern name (case-insensitive)
            const isDuplicate = await checkDuplicatePatternName(patternName);
            if (isDuplicate) {
                if (patternDuplicateNameWarningModal && patternDuplicateNameMessage) {
                    patternDuplicateNameMessage.textContent = `Pattern name "${patternName}" already exists. Please use a different name.`;
                    patternDuplicateNameWarningModal.classList.remove('is-hidden');
                }
                return;
            }

            const formData = new FormData();
            patternFilesToUpload.forEach(file => {
                formData.append('patterns', file);
            });
            formData.append('tags', JSON.stringify([]));
            formData.append('patternName', patternName);

            patternUploadButton.disabled = true;
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.classList.remove('is-hidden');
            try {
                const sessionToken = localStorage.getItem('sessionToken');
                const headers = {};
                if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
                const uploadUrl = `${API_URL}/api/patterns/upload`;
                console.log('[Pattern Upload] API_URL:', API_URL);
                console.log('[Pattern Upload] Upload URL:', uploadUrl);
                console.log('[Pattern Upload] Files to upload:', patternFilesToUpload.length);
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });
                if (loadingOverlay) loadingOverlay.classList.add('is-hidden');
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upload failed: ${errorText}`);
                }
                const result = await response.json();
                
                // Clear left screen after upload
                if (patternPreviewGrid) patternPreviewGrid.innerHTML = '';
                patternFilesToUpload = [];
                if (patternFileInput) patternFileInput.value = '';
                if (patternNameInput) patternNameInput.value = '';
                
                // Refresh right screen to show uploaded patterns
                await loadPatternThumbnails();
                // Also reload patterns into dropdown on upload page
                await loadPatternsIntoDropdown();
                
                // Show success modal
                if (patternUploadSuccessMessage && patternUploadSuccessModal) {
                    patternUploadSuccessMessage.textContent = 'Successfully uploaded pattern file!';
                    patternUploadSuccessModal.classList.remove('is-hidden');
                }
                patternUploadButton.disabled = false;
            } catch (error) {
                console.error('Error uploading patterns:', error);
                // Show error modal
                if (patternUploadErrorMessage && patternUploadErrorModal) {
                    patternUploadErrorMessage.textContent = `An error occurred during pattern upload. Please try again.${error.message ? ' Details: ' + error.message : ''}`;
                    patternUploadErrorModal.classList.remove('is-hidden');
                }
                if (loadingOverlay) loadingOverlay.classList.add('is-hidden');
                patternUploadButton.disabled = false;
            }
        });
    }

    // Function to check if a pattern name already exists (case-insensitive)
    async function checkDuplicatePatternName(patternName) {
        if (!patternName || !patternName.trim()) {
            return false;
        }
        
        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${API_URL}/api/patterns`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error('Failed to load patterns for duplicate check:', response.status);
                return false; // If we can't check, allow the upload
            }

            const patterns = await response.json();
            const inputNameLower = patternName.trim().toLowerCase();
            
            // Check if any existing pattern has the same name (case-insensitive)
            return patterns.some(pattern => {
                const existingName = (pattern.name || '').trim().toLowerCase();
                return existingName === inputNameLower;
            });
        } catch (error) {
            console.error('Error checking duplicate pattern name:', error);
            return false; // If there's an error, allow the upload
        }
    }

    // Function to load patterns into dropdown
    async function loadPatternsIntoDropdown() {
        if (!patternDropdownOptions) return;

        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${API_URL}/api/patterns`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error('Failed to load patterns:', response.status);
                return;
            }

            const patterns = await response.json();
            
            // Ensure dropdown menu is hidden when loading patterns
            if (patternDropdownMenu) {
                patternDropdownMenu.classList.add('is-hidden');
            }
            
            // Clear existing options
            patternDropdownOptions.innerHTML = '';

            if (patterns.length === 0) {
                const noPatternsOption = document.createElement('div');
                noPatternsOption.className = 'pattern-dropdown-option';
                noPatternsOption.textContent = 'No patterns available';
                noPatternsOption.style.padding = '10px';
                noPatternsOption.style.color = '#999';
                patternDropdownOptions.appendChild(noPatternsOption);
                return;
            }

            // Add patterns to dropdown with thumbnails
            patterns.forEach(pattern => {
                const option = document.createElement('div');
                option.className = 'pattern-dropdown-option';
                option.dataset.patternId = pattern.id;
                option.dataset.patternName = pattern.name || 'Unnamed Pattern';
                option.dataset.patternFilepath = pattern.filepath;
                
                // Create thumbnail container
                const thumbnailContainer = document.createElement('div');
                thumbnailContainer.className = 'pattern-option-thumbnail';
                
                const img = document.createElement('img');
                const filename = pattern.filepath.split(/[/\\]/).pop();
                img.src = `${API_URL}/uploads/patterns/${filename}`;
                img.alt = pattern.name || 'Pattern';
                img.onerror = function() {
                    // If image fails to load, show placeholder
                    this.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.className = 'pattern-option-placeholder';
                    placeholder.innerHTML = '📄';
                    thumbnailContainer.appendChild(placeholder);
                };
                
                thumbnailContainer.appendChild(img);
                
                // Create name container
                const nameContainer = document.createElement('div');
                nameContainer.className = 'pattern-option-name';
                nameContainer.textContent = pattern.name || 'Unnamed Pattern';
                
                option.appendChild(thumbnailContainer);
                option.appendChild(nameContainer);
                
                // Mark as selected if this is the currently selected pattern
                if (selectedPatternId && pattern.id === selectedPatternId) {
                    option.classList.add('selected');
                }
                
                // Add click handler
                option.addEventListener('click', () => {
                    selectPattern(pattern.id, pattern.name || 'Unnamed Pattern', pattern.filepath);
                });
                
                patternDropdownOptions.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading patterns into dropdown:', error);
        }
    }

    // Function to select a pattern
    function selectPattern(patternId, patternName, patternFilepath) {
        selectedPatternId = patternId;
        selectedPatternData = { id: patternId, name: patternName, filepath: patternFilepath };
        
        // Remove selected class from all options
        if (patternDropdownOptions) {
            const allOptions = patternDropdownOptions.querySelectorAll('.pattern-dropdown-option');
            allOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to the clicked option
            const selectedOption = patternDropdownOptions.querySelector(`[data-pattern-id="${patternId}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        }
        
        // Update dropdown toggle text
        if (patternDropdownText) {
            patternDropdownText.textContent = patternName;
        }
        
        // Hide dropdown menu (collapse after selection)
        if (patternDropdownMenu) {
            patternDropdownMenu.classList.add('is-hidden');
        }
        
        // Show preview
        if (selectedPatternName) {
            selectedPatternName.textContent = patternName;
        }
        
        if (selectedPatternThumbnail && patternFilepath) {
            const filename = patternFilepath.split(/[/\\]/).pop();
            selectedPatternThumbnail.src = `${API_URL}/uploads/patterns/${filename}`;
            selectedPatternThumbnail.onerror = function() {
                this.style.display = 'none';
            };
            selectedPatternThumbnail.style.display = 'block';
        }
        
        if (selectedPatternPreview) {
            selectedPatternPreview.classList.remove('is-hidden');
        }
    }

    let patternApplyPatterns = []; // Store patterns for filtering

    // Pattern Apply canvas state
    let patternApplyBaseImage = null; // HTMLImageElement
    let patternApplyBaseImageData = null; // ImageData (original pixels)
    let patternApplyCurrentImageData = null; // ImageData (mutable / after applying patterns)
    let patternApplyPatternImageCache = new Map(); // url -> HTMLImageElement
    let patternApplyLastHover = { x: -1, y: -1, key: '' };
    const PATTERN_APPLY_TOLERANCE = 20; // flood fill color tolerance

    // Render the pattern list in the Pattern Apply right panel
    function renderPatternApplyList(patternsToRender) {
        const listEl = document.getElementById('pattern-apply-pattern-list');
        if (!listEl) return;

        listEl.innerHTML = '';

        if (!patternsToRender || patternsToRender.length === 0) {
            listEl.innerHTML = '<p class="text">No patterns found.</p>';
            return;
        }

        patternsToRender.forEach(pattern => {
            const row = document.createElement('div');
            row.className = 'pattern-apply-pattern-row';
            row.dataset.patternId = pattern.id;

            const thumbWrap = document.createElement('div');
            thumbWrap.className = 'pattern-apply-pattern-thumb-wrap';

            const img = document.createElement('img');
            img.className = 'pattern-apply-pattern-thumb';
            const filename = (pattern.filepath || '').split(/[/\\]/).pop();
            img.src = filename ? `${API_URL}/uploads/patterns/${filename}` : '';
            img.alt = pattern.name || 'Pattern';
            img.loading = 'lazy';
            img.onerror = function() {
                this.style.display = 'none';
                thumbWrap.innerHTML = '<div class="pattern-apply-pattern-thumb-fallback">📄</div>';
            };

            const name = document.createElement('div');
            name.className = 'pattern-apply-pattern-name';
            name.textContent = pattern.name || 'Unnamed Pattern';

            thumbWrap.appendChild(img);
            row.appendChild(thumbWrap);
            row.appendChild(name);

            // Make the pattern row draggable
            row.draggable = true;
            row.addEventListener('dragstart', (e) => {
                // Store the pattern's image URL for the drop event
                e.dataTransfer.setData('text/plain', img.src);
                e.dataTransfer.effectAllowed = 'copy';
            });

            listEl.appendChild(row);
        });
    }

    // Fetch patterns for Pattern Apply right panel (list view)
    async function loadPatternsForPatternApply() {
        const listEl = document.getElementById('pattern-apply-pattern-list');
        if (!listEl) return;

        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${API_URL}/api/patterns`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error('Failed to load patterns for pattern apply:', response.status);
                listEl.innerHTML = '<p class="text">Failed to load patterns.</p>';
                return;
            }

            const patterns = await response.json();

            patternApplyPatterns = Array.isArray(patterns) ? patterns : [];

            // Initial render
            renderPatternApplyList(patternApplyPatterns);

            // Hook up search input (once)
            const searchInput = document.getElementById('pattern-apply-search-input');
            if (searchInput && !searchInput.dataset.bound) {
                searchInput.dataset.bound = 'true';
                searchInput.addEventListener('input', () => {
                    const q = (searchInput.value || '').trim().toLowerCase();
                    if (!q) {
                        renderPatternApplyList(patternApplyPatterns);
                        return;
                    }
                    const filtered = patternApplyPatterns.filter(p => (p.name || '').toLowerCase().includes(q));
                    renderPatternApplyList(filtered);
                });
            }
        } catch (error) {
            console.error('Error loading patterns for pattern apply:', error);
            listEl.innerHTML = '<p class="text">Error loading patterns.</p>';
        }
    }

    // Pattern Apply - Initialize drag/drop, browse, paste
    function initializePatternApplyDropzone() {
        const dropzone = document.getElementById('pattern-apply-dropzone');
        const fileInput = document.getElementById('pattern-apply-file-input');
        const browseBtn = document.getElementById('pattern-apply-browse-btn');
        const previewGrid = document.getElementById('pattern-apply-preview-grid');
        const dropText = dropzone.querySelector('.pattern-apply-dropzone__text');
        
        if (!dropzone || !fileInput || !browseBtn) return;

        // Handle file selection via browse button
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            handleDroppedFiles(e.target.files);
            fileInput.value = ''; // Reset to allow selecting same file again
        });

        // Handle drag over
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('is-dragover');
        });

        // Handle drag leave
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('is-dragover');
        });

        // Handle drop
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('is-dragover');
            
            if (e.dataTransfer.files.length > 0) {
                handleDroppedFiles(e.dataTransfer.files);
            }
        });

        // Handle paste
        document.addEventListener('paste', (e) => {
            // Only handle paste when on the pattern-apply page
            if (!pages['pattern-apply'] || pages['pattern-apply'].classList.contains('is-hidden')) {
                return;
            }
            
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            const files = [];
            
            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) files.push(file);
                }
            }
            
            if (files.length > 0) {
                e.preventDefault();
                handleDroppedFiles(files);
            }
        });

        // Process dropped/pasted files
        function handleDroppedFiles(fileList) {
            const files = Array.from(fileList).filter(file => file.type && file.type.startsWith('image/'));
            if (files.length === 0) return;

            // Use the first image only (show it inside the dropzone)
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;

                // Set image as dropzone background
                dropzone.style.backgroundImage = `url(${dataUrl})`;

                // Mirror the exact same image into the center section canvas
                loadPatternApplyBaseImageToCanvas(dataUrl);

                // Hide helper text once an image is present
                if (dropText) dropText.style.display = 'none';

                // Clear any previous grid (grid is hidden via CSS anyway)
                if (previewGrid) previewGrid.innerHTML = '';
            };
            reader.readAsDataURL(file);
        }
    }

    // --- Pattern Apply Canvas & Flood Fill ---

    function loadPatternApplyBaseImageToCanvas(dataUrl) {
        const canvas = document.getElementById('pattern-apply-center-canvas');
        const hint = document.querySelector('.pattern-apply-center-preview__hint');
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            patternApplyBaseImage = img;
            
            // Scale canvas to fit image while maintaining aspect ratio
            const parent = canvas.parentElement;
            const parentRect = parent.getBoundingClientRect();
            const imgAspectRatio = img.width / img.height;
            const parentAspectRatio = parentRect.width / parentRect.height;

            let canvasW, canvasH;
            if (imgAspectRatio > parentAspectRatio) {
                canvasW = parentRect.width;
                canvasH = parentRect.width / imgAspectRatio;
            } else {
                canvasH = parentRect.height;
                canvasW = parentRect.height * imgAspectRatio;
            }
            
            canvas.width = canvasW;
            canvas.height = canvasH;
            
            // Draw image, store pixel data
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            patternApplyBaseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            patternApplyCurrentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            if (hint) hint.style.display = 'none';
        };
        img.src = dataUrl;
    }

    // Flood fill utility
    function floodFill(ctx, x, y, fillColor, tolerance) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const { width, height, data } = imageData;
        const stack = [[x, y]];
        const initialColor = getColorAtPixel(data, width, x, y);
        const visited = new Uint8Array(width * height);

        if (colorsAreSimilar(initialColor, fillColor, tolerance)) {
            return null; // Clicked on an area that's already the target color
        }

        const highlightMask = new Uint8ClampedArray(width * height * 4);

        while (stack.length > 0) {
            const [curX, curY] = stack.pop();
            const pixelIndex = (curY * width + curX);

            if (curX < 0 || curX >= width || curY < 0 || curY >= height || visited[pixelIndex]) {
                continue;
            }

            const currentColor = getColorAtPixel(data, width, curX, curY);

            if (colorsAreSimilar(initialColor, currentColor, tolerance)) {
                visited[pixelIndex] = 1;

                // Set highlight mask pixel
                const dataIndex = pixelIndex * 4;
                highlightMask[dataIndex] = 255; // R
                highlightMask[dataIndex + 1] = 255; // G
                highlightMask[dataIndex + 2] = 0;   // B
                highlightMask[dataIndex + 3] = 100; // A (semi-transparent)

                stack.push([curX + 1, curY]);
                stack.push([curX - 1, curY]);
                stack.push([curX, curY + 1]);
                stack.push([curX, curY - 1]);
            }
        }
        return new ImageData(highlightMask, width, height);
    }

    function getColorAtPixel(data, width, x, y) {
        const i = (y * width + x) * 4;
        return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    }

    function colorsAreSimilar(c1, c2, tolerance) {
        const dr = c1[0] - c2[0];
        const dg = c1[1] - c2[1];
        const db = c1[2] - c2[2];
        // Optional: include alpha in distance check if needed
        // const da = c1[3] - c2[3]; 
        return (dr * dr + dg * dg + db * db) < (tolerance * tolerance);
    }

    // Pattern Apply - Drag pattern onto center preview
    function initializePatternApplyPatternDrop() {
        const centerPreview = document.getElementById('pattern-apply-center-preview');
        const canvas = document.getElementById('pattern-apply-center-canvas');
        if (!centerPreview || !canvas) return;

        const ctx = canvas.getContext('2d');
        const resetBtn = document.getElementById('pattern-apply-reset-btn');

        if (resetBtn && !resetBtn.dataset.bound) {
            resetBtn.dataset.bound = 'true';
            resetBtn.addEventListener('click', () => {
                if (!patternApplyBaseImageData) return;
                // Reset current image back to the original base image
                patternApplyCurrentImageData = new ImageData(
                    new Uint8ClampedArray(patternApplyBaseImageData.data),
                    patternApplyBaseImageData.width,
                    patternApplyBaseImageData.height
                );
                ctx.putImageData(patternApplyCurrentImageData, 0, 0);

                // Reset hover cache
                patternApplyLastHover = { x: -1, y: -1, key: '' };
            });
        }

        centerPreview.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!patternApplyBaseImageData) return;
            
            centerPreview.classList.add('is-dragover');
            e.dataTransfer.dropEffect = 'copy';

            const rect = canvas.getBoundingClientRect();
            const x = Math.floor(e.clientX - rect.left);
            const y = Math.floor(e.clientY - rect.top);

            const hoverKey = `${x},${y}`;
            if (patternApplyLastHover.key === hoverKey) return; // Avoid re-computing for same pixel

            patternApplyLastHover.key = hoverKey;
            centerPreview.classList.add('is-working');

            // Use setTimeout to allow spinner to render before blocking thread
            setTimeout(() => {
                const highlightMask = floodFill(ctx, x, y, [0,0,0,0], PATTERN_APPLY_TOLERANCE);
                
                // Redraw original image, then highlight on top
                ctx.putImageData(patternApplyCurrentImageData, 0, 0);
                if (highlightMask) {
                    ctx.putImageData(highlightMask, 0, 0);
                }
                centerPreview.classList.remove('is-working');
            }, 10);
        });

        centerPreview.addEventListener('dragleave', () => {
            centerPreview.classList.remove('is-dragover');
            // Clear highlight
            if (patternApplyBaseImageData) {
                ctx.putImageData(patternApplyCurrentImageData, 0, 0);
            }
        });

        centerPreview.addEventListener('drop', (e) => {
            e.preventDefault();
            centerPreview.classList.remove('is-dragover');
            if (!patternApplyBaseImageData) return;

            const patternUrl = e.dataTransfer.getData('text/plain');
            if (!patternUrl) return;

            const rect = canvas.getBoundingClientRect();
            const x = Math.floor(e.clientX - rect.left);
            const y = Math.floor(e.clientY - rect.top);

            centerPreview.classList.add('is-working');

            setTimeout(() => {
                // Final flood fill to get the definitive mask
                const fillMask = floodFill(ctx, x, y, [0,0,0,0], PATTERN_APPLY_TOLERANCE);

                if (fillMask) {
                    applyPatternToMask(patternUrl, fillMask);
                }
                centerPreview.classList.remove('is-working');
            }, 10);
        });

        function applyPatternToMask(patternUrl, mask) {
            const patternImg = new Image();
            patternImg.crossOrigin = 'Anonymous';
            patternImg.onload = () => {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;

                // Create a tiled pattern
                const pattern = tempCtx.createPattern(patternImg, 'repeat');
                tempCtx.fillStyle = pattern;
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                const patternData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const finalData = patternApplyCurrentImageData.data;
                const maskData = mask.data;

                // Use the mask to blend the pattern into the current image data
                for (let i = 0; i < finalData.length; i += 4) {
                    if (maskData[i + 3] > 0) { // If pixel is in the mask
                        finalData[i] = patternData.data[i];
                        finalData[i + 1] = patternData.data[i + 1];
                        finalData[i + 2] = patternData.data[i + 2];
                        // Keep original alpha if needed, or set to 255
                        // finalData[i + 3] = patternData.data[i + 3]; 
                    }
                }
                
                // Update the main canvas
                ctx.putImageData(patternApplyCurrentImageData, 0, 0);
            };
            patternImg.src = patternUrl;
        }
    }

    // Pattern Apply hover preview modal helpers
    function showPatternHoverModal(imageUrl, targetElement) {
        const modal = document.getElementById('pattern-hover-modal');
        const img = document.getElementById('pattern-hover-modal-img');
        if (!modal || !img || !imageUrl || !targetElement) return;

        img.src = imageUrl;
        modal.classList.remove('is-hidden');

        const content = modal.querySelector('.pattern-hover-modal__content');
        const rightPanel = document.querySelector('.pattern-apply-right');
        if (!content || !rightPanel) return;

        const gap = 12;
        const thumbRect = targetElement.getBoundingClientRect();
        const panelRect = rightPanel.getBoundingClientRect();
        const viewportH = window.innerHeight;

        // Allowed area is ONLY the Left (40%) + Center (40%) sections
        // i.e., everything strictly left of the right panel
        const maxAllowedRight = panelRect.left - gap;

        // Force the preview image to render at 1:1 pixel size
        // (use natural sizes if available; otherwise fall back to an upper bound)
        const naturalW = img.naturalWidth || 0;
        const naturalH = img.naturalHeight || 0;

        const applyPosition = () => {
            const imgW = img.naturalWidth || naturalW || 600;
            const imgH = img.naturalHeight || naturalH || 600;

            // Ensure true 1:1 sizing
            img.style.width = `${imgW}px`;
            img.style.height = `${imgH}px`;
            img.style.maxWidth = 'none';
            img.style.maxHeight = 'none';

            // Prefer to open to the right of the thumbnail
            let left = thumbRect.right + gap;
            let top = thumbRect.top;

            // If opening right would overlap the 20% right column, flip to left
            if (left + imgW > panelRect.left - gap) {
                left = thumbRect.left - gap - imgW;
            }

            // Clamp horizontally so the preview NEVER crosses into the right 20% column
            // Note: if the image is too wide to fit, we anchor it to the left gap.
            const latestPanelRect = rightPanel.getBoundingClientRect();
            const maxAllowedRightEdge = latestPanelRect.left - gap;

            if (imgW >= (maxAllowedRightEdge - gap)) {
                left = gap;
            } else {
                left = Math.max(gap, Math.min(left, maxAllowedRightEdge - imgW));
            }

            // Clamp vertically into viewport
            top = Math.max(gap, Math.min(top, viewportH - imgH - gap));

            // Position the content box directly (no translate centering)
            content.style.left = `${left}px`;
            content.style.top = `${top}px`;
            content.style.transform = 'none';
            content.style.maxWidth = 'none';
        };

        // If image already loaded, position now; otherwise wait for load
        if (img.complete && img.naturalWidth) {
            applyPosition();
        } else {
            img.onload = () => applyPosition();
            img.onerror = () => {
                // Fail gracefully
                modal.classList.add('is-hidden');
                img.src = '';
            };
        }
    }

    function hidePatternHoverModal() {
        const modal = document.getElementById('pattern-hover-modal');
        const img = document.getElementById('pattern-hover-modal-img');
        if (!modal || !img) return;

        modal.classList.add('is-hidden');
        img.src = '';
    }

    // Function to load and display pattern thumbnails in right panel
    async function loadPatternThumbnails() {
        const patternThumbnailsGrid = document.getElementById('pattern-thumbnails-grid');
        if (!patternThumbnailsGrid) return;

        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${API_URL}/api/patterns`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error('Failed to load patterns:', response.status);
                patternThumbnailsGrid.innerHTML = '<p class="text">Failed to load patterns.</p>';
                return;
            }

            const patterns = await response.json();
            patternThumbnailsGrid.innerHTML = '';

            if (patterns.length === 0) {
                patternThumbnailsGrid.innerHTML = '<p class="text">No patterns uploaded yet.</p>';
                return;
            }

            patterns.forEach(pattern => {
                const thumbnailItem = document.createElement('div');
                thumbnailItem.className = 'pattern-thumbnail-item';
                thumbnailItem.dataset.patternId = pattern.id;
                
                // Container for image with delete button overlay
                const imageContainer = document.createElement('div');
                imageContainer.className = 'pattern-thumbnail-image-container';
                imageContainer.style.cssText = 'position: relative; width: 100%;';
                
                const img = document.createElement('img');
                img.className = 'pattern-thumbnail-image';
                // Extract filename from filepath
                const filename = pattern.filepath.split(/[/\\]/).pop();
                img.src = `${API_URL}/uploads/patterns/${filename}`;
                img.alt = pattern.name || 'Pattern';
                img.onerror = function() {
                    // If image fails to load, show file icon
                    this.style.display = 'none';
                    const fileIcon = document.createElement('div');
                    fileIcon.innerHTML = '📄';
                    fileIcon.style.cssText = 'font-size: 32px; text-align: center; padding: 20px; width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #f5f5f5;';
                    imageContainer.insertBefore(fileIcon, imageContainer.firstChild);
                };
                
                // Delete button (red X) - appears on hover
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'pattern-thumbnail-delete-btn';
                deleteBtn.innerHTML = '✕';
                deleteBtn.type = 'button';
                deleteBtn.style.cssText = 'position: absolute; top: 5px; right: 5px; width: 28px; height: 28px; background: #dc3545; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; z-index: 10;';
                deleteBtn.title = 'Delete pattern';
                
                // Show delete button on hover
                thumbnailItem.addEventListener('mouseenter', () => {
                    deleteBtn.style.opacity = '1';
                });
                thumbnailItem.addEventListener('mouseleave', () => {
                    deleteBtn.style.opacity = '0';
                });
                
                // Handle delete button click
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDeletePatternModal(pattern.id, pattern.name || 'Unnamed Pattern');
                });
                
                imageContainer.appendChild(img);
                imageContainer.appendChild(deleteBtn);
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'pattern-thumbnail-name';
                nameDiv.textContent = pattern.name || 'Unnamed Pattern';
                
                thumbnailItem.appendChild(imageContainer);
                thumbnailItem.appendChild(nameDiv);
                patternThumbnailsGrid.appendChild(thumbnailItem);
            });
        } catch (error) {
            console.error('Error loading pattern thumbnails:', error);
            patternThumbnailsGrid.innerHTML = '<p class="text">Error loading patterns.</p>';
        }
    }

    // Handle pattern dropdown toggle click
    if (patternDropdownToggle) {
        patternDropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (patternDropdownMenu) {
                patternDropdownMenu.classList.toggle('is-hidden');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (patternDropdownMenu && !patternDropdownMenu.contains(e.target) && 
            patternDropdownToggle && !patternDropdownToggle.contains(e.target)) {
            patternDropdownMenu.classList.add('is-hidden');
        }
    });

    // Handle Upload Pattern button click
    if (uploadPatternBtn) {
        uploadPatternBtn.addEventListener('click', () => {
            // Navigate to upload pattern page
            const navUploadPattern = document.getElementById('nav-upload-pattern');
            if (navUploadPattern) {
                navUploadPattern.click();
            }
        });
    }

    // Handle OK button for feelings warning modal
    if (okFeelingsBtn) {
        okFeelingsBtn.addEventListener('click', () => {
            feelingsWarningModal.classList.add('is-hidden');
            // Focus on subjective input
            if (subjInput) {
                subjInput.focus();
            }
        });
    }

    uploadButton.addEventListener('click', async () => {
        const subjTags = Array.from(subjChips.querySelectorAll('.chip')).map(chip => chip.textContent.replace(/[×x]$/, '').trim());
        const objTags = Array.from(objChips.querySelectorAll('.chip')).map(chip => chip.textContent.replace(/[×x]$/, '').trim());
        
        // Get width/length values from input fields
        const widthValue = objWidthInput ? objWidthInput.value.trim() : '';
        const lengthValue = objLengthInput ? objLengthInput.value.trim() : '';
        
        // Check if width/length are already in chips
        const hasWidthInChips = objTags.some(tag => tag.toLowerCase().startsWith('width:'));
        const hasLengthInChips = objTags.some(tag => tag.toLowerCase().startsWith('length:'));
        
        // Add width/length from input fields if they exist and aren't already in chips
        if (widthValue && !hasWidthInChips) {
            // Add prefix if not already present
            const widthTag = widthValue.toLowerCase().startsWith('width:') ? widthValue : `width:${widthValue}`;
            objTags.push(widthTag);
        }
        if (lengthValue && !hasLengthInChips) {
            // Add prefix if not already present
            const lengthTag = lengthValue.toLowerCase().startsWith('length:') ? lengthValue : `length:${lengthValue}`;
            objTags.push(lengthTag);
        }
        
        // Process all other objective inputs and add prefixes if needed
        const objectiveInputs = [
            { input: objBookInput, prefix: 'book:' },
            { input: objPageInput, prefix: 'page:' },
            { input: objRowInput, prefix: 'row:' },
            { input: objColumnInput, prefix: 'column:' },
            { input: objTypeInput, prefix: 'type:' },
            { input: objMaterialInput, prefix: 'material:' },
            { input: objRemarkInput, prefix: 'remark:' },
            { input: objBrandInput, prefix: 'brand:' },
            { input: objColorInput, prefix: 'color:' }
        ];
        
        objectiveInputs.forEach(({ input, prefix }) => {
            if (input && input.value.trim()) {
                const value = input.value.trim();
                const hasInChips = objTags.some(tag => tag.toLowerCase().startsWith(prefix));
                if (!hasInChips) {
                    // Add prefix if not already present
                    const tag = value.toLowerCase().startsWith(prefix) ? value : `${prefix}${value}`;
                    objTags.push(tag);
                }
            }
        });

        // Handle pattern select separately (get pattern name, not ID)
        if (selectedPatternData && selectedPatternData.id) {
            const patternName = selectedPatternData.name;
            const prefix = 'pattern:';
            const hasInChips = objTags.some(tag => tag.toLowerCase().startsWith(prefix));
            if (!hasInChips && patternName) {
                const tag = patternName.toLowerCase().startsWith(prefix) ? patternName : `${prefix}${patternName}`;
                objTags.push(tag);
            }
        }
        
        const allTags = [...subjTags, ...objTags];

        if (filesToUpload.length === 0) {
            // Show warning modal instead of alert
            if (noImagesWarningModal) {
                noImagesWarningModal.classList.remove('is-hidden');
            }
            return;
        }

        // Validate that at least one subjective tag (feeling) is added
        if (subjTags.length === 0) {
            // Show warning modal instead of alert
            if (feelingsWarningModal) {
                feelingsWarningModal.classList.remove('is-hidden');
            }
            return;
        }

        // Validate that at least one dimension field (width or length) is filled
        if (!widthValue && !lengthValue && !hasWidthInChips && !hasLengthInChips) {
            // Show warning modal instead of alert
            if (dimensionWarningModal) {
                dimensionWarningModal.classList.remove('is-hidden');
            }
            return;
        }

        const formData = new FormData();
        filesToUpload.forEach(file => {
            formData.append('images', file);
        });
        formData.append('tags', JSON.stringify(allTags));

        uploadButton.disabled = true;
        loadingOverlay.classList.remove('is-hidden');

        try {
            const sessionToken = localStorage.getItem('sessionToken');
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            loadingOverlay.classList.add('is-hidden');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${errorText}`);
            }

            // Track tag creation timestamps for uploaded images
            const currentTimestamp = Date.now();
            allTags.forEach(tag => {
                if (!tagCreationOrder[tag]) {
                    tagCreationOrder[tag] = currentTimestamp;
                    console.log(`Tag "${tag}" first created during upload at:`, tagCreationOrder[tag]);
                }
            });
            saveTagCreationOrder();

            // Clear the upload form
            clearUploadUI();
            
            // Reload images to show the newly uploaded ones
            await displayLibraryImages();

            // Refresh frequency list based on newly saved tags
            await fetchSubjFrequencies().then(() => {
                const now = new Date().toISOString();
                console.log(`[freq-refresh] Refreshed after upload at ${now}`);
            });

            // On success, show the custom confirmation dialog
            confirmModal.classList.remove('is-hidden');

        } catch (error) {
            console.error('Error uploading images:', error);
            alert(`An error occurred during upload. Please try again. Details: ${error.message}`);
            loadingOverlay.classList.add('is-hidden');
            uploadButton.disabled = false;
        }
    });





    // Handle tag input with Enter, Tab, comma, and autocomplete navigation
    librarySearchInput.addEventListener('keydown', async (e) => {
        if (autocompleteVisible) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightAutocompleteItem('down');
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightAutocompleteItem('up');
                return;
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideAutocomplete();
                return;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (selectHighlightedItem()) {
                    return; // Item was selected from autocomplete
                }
                // Fall through to normal tag commit if no item highlighted
            }
        }

        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            await handleSearchTagCommit();
        }
        // Note: Backspace functionality for removing tag chips has been disabled
        // Users must use the "x" button on individual chips or "Clear All" button
    });

    // Handle autocomplete on input
    librarySearchInput.addEventListener('input', async (e) => {
        const value = e.target.value;
        const lastCommaIndex = value.lastIndexOf(',');

        // Get the current word being typed (after last comma or from beginning)
        const currentWord = lastCommaIndex === -1
            ? value.trim()
            : value.substring(lastCommaIndex + 1).trim();

        if (currentWord.length >= 2) {
            await showAutocomplete(currentWord);
        } else {
            hideAutocomplete();
        }
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) {
            hideAutocomplete();
        }
    });

    // Also handle input changes for real-time search (no longer clears chips on Backspace/Delete)
    librarySearchInput.addEventListener('input', (e) => {
        console.log('=== INPUT EVENT TRIGGERED (no auto-clear) ===');
        console.log('Input value:', `"${e.target.value}"`);
        console.log('programmaticUpdate flag:', e.target.dataset.programmaticUpdate);
        console.log('isPoolView:', isPoolView);
        // Tags can only be removed via chip "×" or Clear All button now.
        console.log('=== INPUT EVENT END ===');
    });

    // Ensure input is fresh on focus
    librarySearchInput.addEventListener('focus', () => {
        // Clear any browser-suggested values on focus
        setTimeout(() => {
            if (librarySearchInput.value && searchTags.length === 0) {
                librarySearchInput.value = '';
            }
        }, 0);
    });

    // Prevent browser from storing values
    librarySearchInput.addEventListener('blur', () => {
        // Don't let browser remember the value
        librarySearchInput.setAttribute('autocomplete', 'new-password');
        setTimeout(() => {
            librarySearchInput.setAttribute('autocomplete', 'off');
        }, 100);
    });

    async function handleSearchTagCommit() {
        const inputValue = librarySearchInput.value.trim();
        if (!inputValue) return;

        console.log('=== ADDING SEARCH TAG ===');
        console.log('Before adding tag - selectedImages:', selectedImages);
        console.log('Before adding tag - tagSelectedImages:', tagSelectedImages);
        console.log('Before adding tag - isPoolView:', isPoolView);

        // Treat the whole input as a single tag (no comma splitting)
        await addSearchTagChip(inputValue);

        // Clear input and refresh search; keep autocomplete closed
        hideAutocomplete();
        autocompleteVisible = false;
        autocompleteHighlightIndex = -1;

        librarySearchInput.value = '';
        librarySearchInput.focus();

        console.log('About to call displayLibraryImages after adding tag');
        displayLibraryImages();
    }

    // Removed searchModeRadios event listener - using default OR mode

    // Clear all button (clears both tags and selected images)
    clearAllTagsBtn.addEventListener('click', async () => {
        await showClearAllConfirmation();
    });

    // Exact word toggle button (exact vs partial tag matching)
    function updateExactWordButtonState() {
        if (!exactWordToggleBtn) return;
        if (exactWordMode) {
            exactWordToggleBtn.classList.add('is-active');
            exactWordToggleBtn.title = 'Exact word match is ON';
        } else {
            exactWordToggleBtn.classList.remove('is-active');
            exactWordToggleBtn.title = 'Exact word match is OFF (partial match)';
        }
    }

    if (exactWordToggleBtn) {
        exactWordToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle the mode FIRST
            const oldMode = exactWordMode;
            exactWordMode = !exactWordMode;
            console.log('=== EXACT WORD BUTTON CLICKED ===');
            console.log('exactWordMode changed from:', oldMode ? 'EXACT' : 'PARTIAL', 'to:', exactWordMode ? 'EXACT' : 'PARTIAL');
            console.log('Button has is-active class BEFORE update:', exactWordToggleBtn.classList.contains('is-active'));
            
            // Update button visual state to match the variable IMMEDIATELY
            updateExactWordButtonState();
            const buttonNowActive = exactWordToggleBtn.classList.contains('is-active');
            console.log('After updateExactWordButtonState - Button has is-active class:', buttonNowActive);
            console.log('exactWordMode variable is now:', exactWordMode);
            console.log('Match mode will be:', exactWordMode ? 'exact' : 'partial');
            
            // Verify they're in sync (should always match after updateExactWordButtonState)
            if (exactWordMode !== buttonNowActive) {
                console.error('SYNC ERROR: exactWordMode (', exactWordMode, ') does not match button state (', buttonNowActive, ')');
                // Force sync - use the variable value as source of truth
                updateExactWordButtonState();
            }
            console.log('=== END BUTTON CLICK ===');

            // Recalculate chip colors/counts to reflect new match mode
            const currentTags = searchTags.map(t => t.text);
            if (currentTags.length > 0) {
                updateTagChipColors(currentTags, tagSearchMode);
            }

            // ALWAYS refresh the display when match mode changes if there are tags or in pool view
            // This ensures results are recalculated with the new exact/partial mode
            if (searchTags.length > 0 || isPoolView) {
                console.log('Refreshing display with new exactWordMode:', exactWordMode, 'matchMode will be:', exactWordMode ? 'exact' : 'partial');
                // Clear selectedImages when match mode changes, as the search results have changed
                // This prevents showing selections from the previous match mode
                const previousSelectedCount = selectedImages.length;
                selectedImages = [];
                console.log('Cleared', previousSelectedCount, 'selected images due to match mode change');
                // Use a small delay to ensure button state is fully updated
                setTimeout(() => {
                    displayLibraryImages().then(() => {
                        console.log('Display refreshed successfully with exactWordMode:', exactWordMode);
                        updateSelectionState();
                    }).catch(error => {
                        console.error('Error refreshing display after exact word toggle:', error);
                        updateSelectionState();
                    });
                }, 10);
            } else {
                updateSelectionState();
            }
        });
    }

    // Tag mode toggle button (AND/OR)
    tagModeToggleBtn.addEventListener('click', () => {
        // Toggle between AND and OR
        tagSearchMode = tagSearchMode === 'OR' ? 'AND' : 'OR';
        console.log('Tag search mode changed to:', tagSearchMode);
        console.log('Current view - isPoolView:', isPoolView, 'searchTags.length:', searchTags.length);
        updateTagModeButtonText();

        // Clear tag-selected images when switching modes
        // The backend will return new results based on the new mode
        console.log('Clearing tagSelectedImages due to mode change');
        tagSelectedImages = [];

        // Clear ALL selections when switching modes (both manual and tag-based)
        // This prevents old OR mode selections from showing in AND mode
        console.log('Clearing all selections due to mode change');
        selectedImages = [];
        imageSelectionSource = {};
        imageSelectionOrder = {};

        // Update separators between chips
        renumberSearchChips();

        // Refresh display immediately if there are search tags OR if in pool view
        if (searchTags.length > 0 || isPoolView) {
            console.log('Refreshing display with mode:', tagSearchMode, 'for tags:', searchTags.map(t => t.text));

            // Force clear the grid before refreshing to remove old cards
            const libraryGrid = document.getElementById('library-grid');
            if (libraryGrid) {
                libraryGrid.innerHTML = '';
            }

            displayLibraryImages().then(() => {
                // Recalculate selection count after mode change (AND/OR affects tagSelectedImages)
                updateSelectionState();
            });
        } else {
            // Even if no tags, update selection count in case mode affects display
            updateSelectionState();
        }
    });

    // Function to update tag mode button text
    function updateTagModeButtonText() {
        if (tagModeToggleBtn) {
            tagModeToggleBtn.textContent = tagSearchMode;
            // Set black background and white text for both OR and AND modes
            tagModeToggleBtn.style.backgroundColor = '#000';
            tagModeToggleBtn.style.color = '#fff';
            console.log('updateTagModeButtonText called - setting button to:', tagSearchMode);
        } else {
            console.error('tagModeToggleBtn is null!');
        }
    }

    // Initialize button text
    updateTagModeButtonText();

    // Initialize exact word button state (default: inactive / partial matches)
    updateExactWordButtonState();

    // Pattern toggle button (pattern tag filtering)
    function updatePatternButtonState() {
        if (!patternToggleBtn) return;
        if (patternMode) {
            patternToggleBtn.classList.add('is-active');
            patternToggleBtn.title = 'Pattern mode is ON (only search pattern tags)';
        } else {
            patternToggleBtn.classList.remove('is-active');
            patternToggleBtn.title = 'Pattern mode is OFF (search all tags)';
        }
    }

    if (patternToggleBtn) {
        patternToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle the mode
            const oldMode = patternMode;
            patternMode = !patternMode;
            console.log('=== PATTERN BUTTON CLICKED ===');
            console.log('patternMode changed from:', oldMode ? 'ON' : 'OFF', 'to:', patternMode ? 'ON' : 'OFF');
            
            // Update button visual state
            updatePatternButtonState();
            const buttonNowActive = patternToggleBtn.classList.contains('is-active');
            console.log('After updatePatternButtonState - Button has is-active class:', buttonNowActive);
            console.log('patternMode variable is now:', patternMode);
            
            // Verify they're in sync
            if (patternMode !== buttonNowActive) {
                console.error('SYNC ERROR: patternMode (', patternMode, ') does not match button state (', buttonNowActive, ')');
                updatePatternButtonState();
            }
            console.log('=== END PATTERN BUTTON CLICK ===');

            // Refresh display if there are search tags
            if (searchTags.length > 0 || isPoolView) {
                console.log('Refreshing display with new patternMode:', patternMode);
                // Clear selectedImages when pattern mode changes
                const previousSelectedCount = selectedImages.length;
                selectedImages = [];
                console.log('Cleared', previousSelectedCount, 'selected images due to pattern mode change');
                // Use a small delay to ensure button state is fully updated
                setTimeout(() => {
                    displayLibraryImages().then(() => {
                        console.log('Display refreshed successfully with patternMode:', patternMode);
                        updateSelectionState();
                    }).catch(error => {
                        console.error('Error refreshing display after pattern toggle:', error);
                        updateSelectionState();
                    });
                }, 10);
            } else {
                updateSelectionState();
            }
        });
    }

    // Initialize pattern button state (default: inactive)
    updatePatternButtonState();

    // Initialize button state
    updateClearButtonState();

    // Tag creation order persistence functions
    function saveTagCreationOrder() {
        try {
            localStorage.setItem('tagCreationOrder', JSON.stringify(tagCreationOrder));
        } catch (error) {
            console.error('Error saving tag creation order:', error);
        }
    }

    function loadTagCreationOrder() {
        try {
            const saved = localStorage.getItem('tagCreationOrder');
            if (saved) {
                tagCreationOrder = JSON.parse(saved);
                console.log('Loaded tag creation order:', tagCreationOrder);
            }
        } catch (error) {
            console.error('Error loading tag creation order:', error);
            tagCreationOrder = {};
        }
    }





    // Initialize search input to be completely fresh
    initializeFreshSearchInput();

    // Load tag creation order from localStorage
    loadTagCreationOrder();

    // Selection and project event listeners
    selectAllBtn.addEventListener('click', selectAllImages);
    deselectAllBtn.addEventListener('click', deselectAllImages);
    updateTagBtn.addEventListener('click', () => {
        console.log('[FRONTEND] Update Tag button clicked');
        console.log('[FRONTEND] selectedImages:', selectedImages);
        console.log('[FRONTEND] tagSelectedImages:', tagSelectedImages);
        
        const allSelectedImageIds = [...new Set([...selectedImages, ...tagSelectedImages])];
        console.log('[FRONTEND] Total selected images:', allSelectedImageIds.length);
        
        if (allSelectedImageIds.length === 0) {
            console.warn('[FRONTEND] No images selected - cannot open mass update modal');
            alert('Please select images first before updating tags.');
            return;
        }
        
        try {
            console.log('[FRONTEND] Opening mass update tag modal...');
            showUpdateTagModal();
            console.log('[FRONTEND] Modal opened successfully');
        } catch (error) {
            console.error('[FRONTEND] Error opening mass update tag modal:', error);
            alert('Error opening tag update modal. Please check the console for details.');
        }
    });
    deleteImageBtn.addEventListener('click', async () => {
        console.log('Delete Image button clicked - showing modal');
        await showDeleteImageModal();
    });
    viewPoolBtn.addEventListener('click', handleViewPoolClick);
    backToLibraryBtn.addEventListener('click', backToLibrary);
    addToProjectBtn.addEventListener('click', showProjectNameModal);
    cancelProjectBtn.addEventListener('click', hideProjectNameModal);
    createProjectBtn.addEventListener('click', createProject);

    // Project created confirmation modal event listeners
    addMoreProjectsBtn.addEventListener('click', () => {
        hideProjectCreatedModal();
        // Stay in current view to allow selecting more images for another project
        console.log('User chose to add more projects');
    });

    goToProjectBtn.addEventListener('click', () => {
        hideProjectCreatedModal();
        // Navigate to the project page
        navigateTo('project');
        console.log('User chose to go to project page');
    });

    // Project detail modal event listeners
    closeProjectDetailBtn.addEventListener('click', hideProjectDetailModal);

    // Project search functionality
    projectSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterProjects(searchTerm);
    });

    projectFilterBtn.addEventListener('click', () => {
        // Future: Add advanced filtering options
        console.log('Filter button clicked - future feature');
    });

    // Project view toggle event listener
    projectViewToggleBtn.addEventListener('click', toggleProjectView);

    // Image preview overlay event listeners
    previewOverlayClose.addEventListener('click', hideImagePreviewOverlay);

    // Real-size display settings and calibration
    const previewOverlaySettings = document.getElementById('preview-overlay-settings');
    const realSizeSettingsModal = document.getElementById('real-size-settings-modal');
    const closeSettingsModalBtn = document.getElementById('close-settings-modal');
    const manualDPIInput = document.getElementById('manual-dpi-input');
    const applyManualDPI = document.getElementById('apply-manual-dpi');
    const resetManualDPI = document.getElementById('reset-manual-dpi');
    const openCalibrationTool = document.getElementById('open-calibration-tool');
    const calibrationToolModal = document.getElementById('calibration-tool-modal');
    const closeCalibrationModalBtn = document.getElementById('close-calibration-modal');
    const calibrationDPISlider = document.getElementById('calibration-dpi-slider');
    const calibrationDPIValue = document.getElementById('calibration-dpi-value');
    const saveCalibratedDPI = document.getElementById('save-calibrated-dpi');
    const cancelCalibration = document.getElementById('cancel-calibration');
    const detectedDPIDisplay = document.getElementById('detected-dpi-display');
    const calibrationObject = document.getElementById('calibration-object');

    // Update detected DPI display
    function updateDetectedDPIDisplay() {
        const currentDPI = window.getCurrentDPI();
        const dpiSource = calibratedDPI ? 'Calibrated' : (manualDPI ? 'Manual' : 'Auto-detected');
        detectedDPIDisplay.textContent = `${currentDPI.toFixed(1)} (${dpiSource})`;
    }

    // Open settings modal
    if (previewOverlaySettings) {
        previewOverlaySettings.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            updateDetectedDPIDisplay();
            if (manualDPI) {
                manualDPIInput.value = manualDPI;
            }
            realSizeSettingsModal.classList.remove('is-hidden');
        });
    }

    // Close settings modal
    function closeSettingsModal() {
        realSizeSettingsModal.classList.add('is-hidden');
    }

    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    }

    // Close settings modal when clicking outside
    if (realSizeSettingsModal) {
        realSizeSettingsModal.addEventListener('click', (e) => {
            if (e.target === realSizeSettingsModal) {
                closeSettingsModal();
            }
        });
    }

    // Apply manual DPI
    if (applyManualDPI) {
        applyManualDPI.addEventListener('click', () => {
            const dpiValue = parseFloat(manualDPIInput.value);
            if (dpiValue && dpiValue >= 72 && dpiValue <= 300) {
                manualDPI = dpiValue;
                localStorage.setItem('manualDPI', dpiValue.toString());
                updateDetectedDPIDisplay();
                alert(`Manual DPI set to ${dpiValue.toFixed(1)}. Real size display will use this value.`);
            } else {
                alert('Please enter a valid DPI between 72 and 300.');
            }
        });
    }

    // Reset manual DPI
    if (resetManualDPI) {
        resetManualDPI.addEventListener('click', () => {
            manualDPI = null;
            localStorage.removeItem('manualDPI');
            manualDPIInput.value = '';
            updateDetectedDPIDisplay();
            alert('Manual DPI reset. Using auto-detected DPI.');
        });
    }

    // Open calibration tool
    if (openCalibrationTool) {
        openCalibrationTool.addEventListener('click', () => {
            realSizeSettingsModal.classList.add('is-hidden');
            const currentDPI = window.getCurrentDPI();
            calibrationDPISlider.value = currentDPI;
            calibrationDPIValue.textContent = currentDPI.toFixed(1);
            updateCalibrationPreview();
            calibrationToolModal.classList.remove('is-hidden');
        });
    }

    // Close calibration modal
    function closeCalibrationModal() {
        calibrationToolModal.classList.add('is-hidden');
    }

    if (closeCalibrationModalBtn) {
        closeCalibrationModalBtn.addEventListener('click', closeCalibrationModal);
    }

    if (cancelCalibration) {
        cancelCalibration.addEventListener('click', closeCalibrationModal);
    }

    // Close calibration modal when clicking outside
    if (calibrationToolModal) {
        calibrationToolModal.addEventListener('click', (e) => {
            if (e.target === calibrationToolModal) {
                closeCalibrationModal();
            }
        });
    }

    // Update calibration preview size
    function updateCalibrationPreview() {
        const dpi = parseFloat(calibrationDPISlider.value);
        const widthMm = 85.6; // Credit card width
        const lengthMm = 53.98; // Credit card length
        const widthPx = window.mmToPixels(widthMm, dpi);
        const lengthPx = window.mmToPixels(lengthMm, dpi);
        
        calibrationObject.style.width = `${widthPx}px`;
        calibrationObject.style.height = `${lengthPx}px`;
    }

    // Calibration DPI slider
    if (calibrationDPISlider) {
        calibrationDPISlider.addEventListener('input', (e) => {
            const dpi = parseFloat(e.target.value);
            calibrationDPIValue.textContent = dpi.toFixed(1);
            updateCalibrationPreview();
        });
    }

    // Save calibrated DPI
    if (saveCalibratedDPI) {
        saveCalibratedDPI.addEventListener('click', () => {
            const dpi = parseFloat(calibrationDPISlider.value);
            calibratedDPI = dpi;
            localStorage.setItem('calibratedDPI', dpi.toString());
            updateDetectedDPIDisplay();
            calibrationToolModal.classList.add('is-hidden');
            alert(`Calibrated DPI saved: ${dpi.toFixed(1)}. This will be used for all real size displays.`);
        });
    }

    // Initialize DPI display
    updateDetectedDPIDisplay();

    // Close overlay when clicking outside the image
    imagePreviewOverlay.addEventListener('click', (e) => {
        if (e.target === imagePreviewOverlay) {
            hideImagePreviewOverlay();
        }
    });

    // Navigation arrow event listeners
    previewNavLeft.addEventListener('click', () => {
        navigatePreview('left');
    });

    previewNavRight.addEventListener('click', () => {
        navigatePreview('right');
    });

    // Close overlay with Escape key and add arrow key scrolling/navigation
    document.addEventListener('keydown', (e) => {
        // Handle Escape key for modals (check outside image preview context)
        if (e.key === 'Escape') {
            if (!deleteProjectConfirmModal.classList.contains('is-hidden')) {
                hideDeleteProjectModal();
                return;
            }
            if (!tagDeleteConfirmModal.classList.contains('is-hidden')) {
                pendingTagDelete = null;
                tagDeleteConfirmModal.classList.add('is-hidden');
                return;
            }
        }
        
        if (imagePreviewOverlay.classList.contains('show')) {
            if (e.key === 'Escape') {
                hideImagePreviewOverlay();
            } else if (isSelectionPoolPreview && e.key === 'ArrowLeft') {
                e.preventDefault();
                navigatePreview('left');
            } else if (isSelectionPoolPreview && e.key === 'ArrowRight') {
                e.preventDefault();
                navigatePreview('right');
            } else if (!isSelectionPoolPreview && e.key === 'ArrowUp') {
                e.preventDefault();
                imagePreviewOverlay.scrollTop -= 50;
            } else if (!isSelectionPoolPreview && e.key === 'ArrowDown') {
                e.preventDefault();
                imagePreviewOverlay.scrollTop += 50;
            } else if (!isSelectionPoolPreview && e.key === 'ArrowLeft') {
                e.preventDefault();
                imagePreviewOverlay.scrollLeft -= 50;
            } else if (!isSelectionPoolPreview && e.key === 'ArrowRight') {
                e.preventDefault();
                imagePreviewOverlay.scrollLeft += 50;
            }
        }
    });

    // Project name input enter key
    projectNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            createProject();
        } else if (e.key === 'Escape') {
            hideProjectNameModal();
        }
    });

    // Share project modal event listeners
    shareProjectClose.addEventListener('click', hideShareProjectModal);
    cancelShareBtn.addEventListener('click', hideShareProjectModal);
    sendShareBtn.addEventListener('click', shareProject);
    
    // Delete project confirmation modal event listeners
    deleteProjectConfirmClose.addEventListener('click', hideDeleteProjectModal);
    deleteProjectCancelBtn.addEventListener('click', hideDeleteProjectModal);
    deleteProjectConfirmBtn.addEventListener('click', () => {
        const projectId = deleteProjectConfirmModal.dataset.projectId;
        if (projectId) {
            deleteProject(parseInt(projectId));
        }
    });

    // Update tag modal event listeners
    updateTagClose.addEventListener('click', hideUpdateTagModal);
    updateTagCancel.addEventListener('click', hideUpdateTagModal);
    updateTagSave.addEventListener('click', saveTagUpdates);
    addNewTagBtn.addEventListener('click', addNewTags);
    removeAllTagsBtn.addEventListener('click', removeAllTagsFromSelected);
    tagUpdateContinueBtn.addEventListener('click', hideTagUpdateSuccess);
    tagRemovalContinueBtn.addEventListener('click', hideTagRemovalNotification);

    // Frequently used sort button event listener
    if (subjFreqSortBtn) {
        subjFreqSortBtn.addEventListener('click', () => {
            subjFreqSortMode = subjFreqSortMode === 'frequency' ? 'alphabetical' : 'frequency';
            subjFreqSortBtn.textContent = subjFreqSortMode === 'alphabetical' ? 'Freq' : 'A-Z';
            subjFreqSortBtn.title = subjFreqSortMode === 'alphabetical' ? 'Sort by Frequency' : 'Sort A-Z';
            updateSubjFreqList();
        });
    }

    // Delete image modal event listeners
    deleteImageClose.addEventListener('click', hideDeleteImageModal);
    cancelDeleteBtn.addEventListener('click', hideDeleteImageModal);
    confirmDeleteBtn.addEventListener('click', deleteSelectedImages);

    // Tag removal confirmation modal event listeners
    tagRemovalConfirmClose.addEventListener('click', hideTagRemovalConfirmModal);
    tagRemovalCancelBtn.addEventListener('click', hideTagRemovalConfirmModal);
    tagRemovalConfirmBtn.addEventListener('click', confirmTagRemoval);
    if (tagDeleteCancelBtn) {
        tagDeleteCancelBtn.addEventListener('click', () => {
            pendingTagDelete = null;
            tagDeleteConfirmModal.classList.add('is-hidden');
        });
    }
    if (tagDeleteConfirmBtn) {
        tagDeleteConfirmBtn.addEventListener('click', confirmRemoveTagFromImage);
    }
    if (lightboxLockBtn) {
        lightboxLockBtn.addEventListener('click', () => {
            if (lightboxLocked) {
                // Show confirmation modal to unlock
                unlockEditingConfirmModal.classList.remove('is-hidden');
            } else {
                // Lock the fields
                lockLightboxFields();
            }
        });
    }

    // Unlock editing confirmation modal event listeners
    if (unlockEditingCancelBtn) {
        unlockEditingCancelBtn.addEventListener('click', () => {
            unlockEditingConfirmModal.classList.add('is-hidden');
        });
    }
    if (unlockEditingConfirmBtn) {
        unlockEditingConfirmBtn.addEventListener('click', () => {
            unlockEditingConfirmModal.classList.add('is-hidden');
            unlockLightboxFields();
        });
    }

    // Lightbox save button event listener
    if (lightboxSaveBtn) {
        lightboxSaveBtn.addEventListener('click', () => {
            if (currentImageIndex >= 0 && currentImageIndex < currentLightboxImages.length) {
                saveAllLightboxChanges();
            }
        });
    }

    // Clear all confirmation modal event listeners
    clearAllConfirmClose.addEventListener('click', hideClearAllConfirmModal);
    clearAllCancelBtn.addEventListener('click', hideClearAllConfirmModal);
    clearAllConfirmBtn.addEventListener('click', confirmClearAll);

    // Delete uploaded image confirmation modal event listeners
    if (deleteUploadImageCancelBtn) {
        deleteUploadImageCancelBtn.addEventListener('click', () => {
            if (deleteUploadImageConfirmModal) {
                deleteUploadImageConfirmModal.classList.add('is-hidden');
            }
        });
    }
    if (deleteUploadImageConfirmBtn) {
        deleteUploadImageConfirmBtn.addEventListener('click', () => {
            if (deleteUploadImageConfirmModal && deleteUploadImageConfirmModal.dataset.cardId) {
                // Find the card by its ID
                const card = previewGrid.querySelector(`[data-card-id="${deleteUploadImageConfirmModal.dataset.cardId}"]`);
                if (card) {
                    // Find the file index
                    const fileIndex = parseInt(deleteUploadImageConfirmModal.dataset.fileIndex);
                    if (fileIndex >= 0 && fileIndex < filesToUpload.length) {
                        filesToUpload.splice(fileIndex, 1);
                    }
                    card.remove();
                    
                    // Update upload-area class after removal
                    setTimeout(() => {
                        const cards = previewGrid.querySelectorAll('.preview-card');
                        const uploadArea = document.getElementById('dropzone');
                        if (cards.length === 1 && uploadArea) {
                            uploadArea.classList.add('single-image');
                        } else if (uploadArea) {
                            uploadArea.classList.remove('single-image');
                        }
                    }, 100);
                }
                deleteUploadImageConfirmModal.classList.add('is-hidden');
            }
        });
    }

    // Add tag input enter key support
    newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewTags();
        }
    });

    // Share email input enter key (only Enter, no ESC)
    shareEmailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            shareProject();
        }
    });

    // Helper function to set user level by email (for admin use in console)
    // Usage: setUserLevelByEmail('eric.brilliant@gmail.com', 3)
    async function setUserLevelByEmail(email, level) {
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
            console.error('No session token found. Please log in first.');
            return;
        }

        if (!hasAdminPrivileges()) {
            console.error('Admin or level 3 access required. Please log in with sufficient access.');
            return;
        }

        if (!email || !level || level < 1 || level > 3) {
            console.error('Invalid parameters. Usage: setUserLevelByEmail(email, level) where level is 1, 2, or 3');
            return;
        }

        try {
            // First, get all users to find the user ID
            console.log(`Finding user: ${email}...`);
            const usersResponse = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });

            if (!usersResponse.ok) {
                throw new Error('Failed to fetch users');
            }

            const users = await usersResponse.json();
            const user = users.find(u => u.email === email);

            if (!user) {
                console.error(`User with email "${email}" not found.`);
                return;
            }

            console.log(`Found user: ${email} (ID: ${user.id}). Current level: ${user.level}. Updating to level ${level}...`);

            // Update the user's level
            const updateResponse = await fetch(`${API_URL}/admin/users/${user.id}/level`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ level: level })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('Update failed:', updateResponse.status, errorText);
                throw new Error(`Failed to update user level: ${updateResponse.status}`);
            }

            const updateResult = await updateResponse.json().catch(() => ({}));
            console.log('Update response:', updateResult);
            console.log(`✅ Successfully updated ${email} to Level ${level}`);
            
            // Verify the update by fetching users again
            try {
                const verifyResponse = await fetch(`${API_URL}/admin/users`, {
                    headers: { 'Authorization': `Bearer ${sessionToken}` }
                });
                if (verifyResponse.ok) {
                    const updatedUsers = await verifyResponse.json();
                    const updatedUser = updatedUsers.find(u => u.email === email);
                    if (updatedUser) {
                        console.log(`✅ Verified in database: ${email} is now Level ${updatedUser.level}`);
                    } else {
                        console.warn('Could not verify update - user not found in list');
                    }
                }
            } catch (verifyErr) {
                console.warn('Could not verify update:', verifyErr);
            }
            
            // If the updated user is the current logged-in user, refresh their session
            if (currentUser && currentUser.email === email) {
                console.log('⚠️ Updated current user - refreshing session...');
                const refreshed = await checkAuthentication();
                if (refreshed) {
                    console.log(`✅ Session refreshed. Current user level is now: ${currentUser.level}`);
                    console.log('Full currentUser object:', JSON.stringify(currentUser, null, 2));
                } else {
                    console.error('Failed to refresh session');
                }
            }
            
            // Reload admin users if on admin page
            if (document.getElementById('page-admin') && !document.getElementById('page-admin').classList.contains('is-hidden')) {
                loadAdminUsers();
            }
        } catch (err) {
            console.error('Error updating user level:', err);
        }
    }

    // Helper function to refresh current user session (useful after level changes)
    // This calls verify-session API endpoint to get updated user data including level
    async function refreshCurrentUserSession() {
        console.log('🔄 Refreshing current user session...');
        console.log('Calling verify-session API endpoint...');
        
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
            console.error('No session token found. Please log in first.');
            return false;
        }

        try {
            const response = await fetch(`${API_URL}/auth/verify-session`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });

            if (!response.ok) {
                console.error('Session verification failed:', response.status);
                return false;
            }

            const result = await response.json();
            const oldLevel = currentUser ? currentUser.level : 'unknown';
            currentUser = result.user;
            const newLevel = currentUser.level;

            console.log('✅ Session refreshed successfully!');
            console.log(`Old level: ${oldLevel} → New level: ${newLevel}`);
            console.log('Updated currentUser object:', currentUser);

            // Re-apply menu visibility based on new level
            const userLevel = parseInt(currentUser.level, 10) || 1;
            const adminLink = document.getElementById('nav-admin');
            const settingsLink = document.getElementById('nav-settings');
            const tagsLink = document.getElementById('nav-tags');

            console.log('🔄 Updating menu visibility for level', userLevel);

            if (userLevel === 1) {
                console.log('Level 1 - hiding Tags, Admin Panel, and Settings');
                if (tagsLink) {
                    tagsLink.classList.add('is-hidden');
                    tagsLink.style.setProperty('display', 'none', 'important');
                }
                if (adminLink) {
                    adminLink.classList.add('is-hidden');
                    adminLink.style.setProperty('display', 'none', 'important');
                }
                if (settingsLink) {
                    settingsLink.classList.add('is-hidden');
                    settingsLink.style.setProperty('display', 'none', 'important');
                }
            } else if (userLevel === 3) {
                console.log('Level 3 - showing all menu items');
                if (tagsLink) {
                    tagsLink.classList.remove('is-hidden');
                    tagsLink.style.setProperty('display', 'block', 'important');
                }
                if (adminLink) {
                    adminLink.classList.remove('is-hidden');
                    adminLink.style.setProperty('display', 'block', 'important');
                }
                if (settingsLink) {
                    settingsLink.classList.remove('is-hidden');
                    settingsLink.style.setProperty('display', 'block', 'important');
                }
            } else {
                // Level 2: Show Tags, Admin/Settings based on admin role
                if (tagsLink) {
                    tagsLink.classList.remove('is-hidden');
                    tagsLink.style.setProperty('display', 'block', 'important');
                }
                if (currentUser.role === 'admin') {
                    if (adminLink) {
                        adminLink.classList.remove('is-hidden');
                        adminLink.style.setProperty('display', 'block', 'important');
                    }
                    if (settingsLink) {
                        settingsLink.classList.remove('is-hidden');
                        settingsLink.style.setProperty('display', 'block', 'important');
                    }
                } else {
                    if (adminLink) {
                        adminLink.classList.add('is-hidden');
                        adminLink.style.setProperty('display', 'none', 'important');
                    }
                    if (settingsLink) {
                        settingsLink.classList.add('is-hidden');
                        settingsLink.style.setProperty('display', 'none', 'important');
                    }
                }
            }

            // Update email display with new level
            updateUserEmailDisplay();

            console.log('✅ Menu visibility updated!');
            return true;
        } catch (error) {
            console.error('Error refreshing session:', error);
            return false;
        }
    }

    // Helper function to check user level from backend
    async function checkUserLevelFromBackend(email) {
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
            console.error('No session token. Please log in first.');
            return;
        }

        if (!hasAdminPrivileges()) {
            console.error('Admin or level 3 access required.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const users = await response.json();
            const user = users.find(u => u.email === email);
            if (user) {
                console.log(`User: ${email}`);
                console.log(`  Level: ${user.level} (type: ${typeof user.level})`);
                console.log(`  ID: ${user.id}`);
                console.log(`  Full user object:`, user);
                return user.level;
            } else {
                console.error(`User "${email}" not found.`);
            }
        } catch (err) {
            console.error('Error checking user level:', err);
        }
    }

    // Quick fix: Update eric.brilliant@gmail.com to level 3
    async function fixEricLevel() {
        console.log('🔧 Fixing eric.brilliant@gmail.com level to 3...');
        await setUserLevelByEmail('eric.brilliant@gmail.com', 3);
        if (currentUser && currentUser.email === 'eric.brilliant@gmail.com') {
            console.log('🔄 Refreshing session...');
            await refreshCurrentUserSession();
            console.log('✅ Done! Check if Tags and Admin Panel are visible now.');
        }
    }

    // Make helper functions available globally
    window.setUserLevelByEmail = setUserLevelByEmail;
    window.refreshCurrentUserSession = refreshCurrentUserSession;
    window.checkUserLevelFromBackend = checkUserLevelFromBackend;
    window.fixEricLevel = fixEricLevel;

    // Check authentication and load projects on startup
    checkAuthentication().then(isAuthenticated => {
        if (isAuthenticated) {
            loadProjectsFromAPI().then(() => {
                displayProjects();
            });
        }
    });


  