import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, FolderPlus, FilePlus, Video, FileText, Download, Plus, ChevronRight, Play } from 'lucide-react';
import ExportDropdown from './ExportDropdown';
import { exportToExcel, exportToCsv, exportToPdfTable } from '../utils/exportHelpers';

const CourseManagementView = ({ apiUrl, token, adminProfile, user }) => {
  const [courses, setCourses] = useState([]);
  
  const handleExportCSV = async () => {
    const headers = ['Title', 'Category', 'Description', 'Duration', 'Level', 'Price', 'Tab'];
    const rows = courses.map(c => [
      c.title || '',
      c.category || '',
      c.desc || '',
      c.duration || '',
      c.level || '',
      c.price || '',
      c.tab || ''
    ]);
    exportToCsv(headers, rows, 'courses_export');
  };

  const handleExportExcel = async () => {
    const data = courses.map(c => ({
      'Title': c.title || '',
      'Category': c.category || '',
      'Description': c.desc || '',
      'Duration': c.duration || '',
      'Level': c.level || '',
      'Price': c.price || '',
      'Tab': c.tab || ''
    }));
    exportToExcel(data, 'Courses', 'courses_export');
  };

  const handleExportPDF = async () => {
    const headers = ['Title', 'Category', 'Duration', 'Level', 'Price', 'Tab'];
    const rows = courses.map(c => [
      c.title || '',
      c.category || '',
      c.duration || '',
      c.level || '',
      c.price || '',
      c.tab || ''
    ]);
    exportToPdfTable({
      title: 'Course Database Report',
      subtitle: `Total Courses: ${courses.length}`,
      headers,
      rows,
      fileName: 'courses_export'
    });
  };

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  
  const [lastFetchedCourseId, setLastFetchedCourseId] = useState(null);
  const [lastFetchedModuleId, setLastFetchedModuleId] = useState(null);
  
  // Modals / forms toggles
  const [activeModal, setActiveModal] = useState(null); // 'course' | 'module' | 'lesson' | null
  
  // Loading states
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    subtitle: '',
    category: 'Placement',
    desc: '',
    duration: '10 hrs duration',
    level: 'All Levels',
    badge: 'FREE',
    badgeClass: 'badge-free',
    price: 'Free Access',
    tab: 'Placement',
    thumbBg: 'c-thumb-1',
    thumbIcon: '🏢',
    is_career_pathway: false,
    is_featured: false,
    display_order: 999,
    pathwayType: 'career',
    status: 'active'
  });

  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    subtitle: '',
    category: 'Placement',
    desc: '',
    duration: '10 hrs duration',
    level: 'All Levels',
    badge: 'FREE',
    badgeClass: 'badge-free',
    price: 'Free Access',
    tab: 'Placement',
    thumbBg: 'c-thumb-1',
    thumbIcon: '🏢',
    is_career_pathway: false,
    is_featured: false,
    display_order: 999,
    pathwayType: 'career',
    status: 'active'
  });

  const [moduleForm, setModuleForm] = useState({
    title: '',
    order: 0
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    video_url: '',
    pdf_url: '',
    code_url: '',
    files_url: '',
    videoSource: 'upload',
    videoUrl: '',
    notesSource: 'upload',
    notesUrl: '',
    sourceCodeSource: 'upload',
    sourceCodeUrl: '',
    projectSource: 'upload',
    projectUrl: '',
    order: 0
  });

  const [editingModule, setEditingModule] = useState(null);
  const [editModuleForm, setEditModuleForm] = useState({
    title: '',
    order: 0
  });

  const [editingLesson, setEditingLesson] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({
    title: '',
    description: '',
    video_url: '',
    pdf_url: '',
    code_url: '',
    files_url: '',
    pdf_file: '',
    notes_file: '',
    assignment_file: '',
    resources_file: '',
    videoSource: 'upload',
    videoUrl: '',
    notesSource: 'upload',
    notesUrl: '',
    sourceCodeSource: 'upload',
    sourceCodeUrl: '',
    projectSource: 'upload',
    projectUrl: '',
    order: 0
  });


  // Selected files for uploads
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedZip, setSelectedZip] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(null);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    if (import.meta.env.DEV) console.log('API Call: GET /api/courses');
    try {
      const res = await fetch(`${apiUrl}/api/courses`);
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses || []);
      }
    } catch (e) {
      console.error('Error fetching courses', e);
    } finally {
      setCoursesLoading(false);
    }
  }, [apiUrl]);

  const fetchModules = useCallback(async (courseId) => {
    if (!courseId) return;
    setModulesLoading(true);
    if (import.meta.env.DEV) console.log(`API Call: GET /api/courses/${courseId}/modules`);
    try {
      const res = await fetch(`${apiUrl}/api/courses/${courseId}/modules`);
      const data = await res.json();
      if (res.ok) {
        setModules(data.modules || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModulesLoading(false);
    }
  }, [apiUrl]);

  const fetchLessons = useCallback(async (moduleId) => {
    if (!moduleId) return;
    setLessonsLoading(true);
    if (import.meta.env.DEV) console.log(`API Call: GET /api/modules/${moduleId}/lessons`);
    try {
      const res = await fetch(`${apiUrl}/api/modules/${moduleId}/lessons`);
      const data = await res.json();
      if (res.ok) {
        setLessons(data.lessons || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLessonsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      if (selectedCourse._id !== lastFetchedCourseId) {
        fetchModules(selectedCourse._id);
        setSelectedModule(null);
        setLessons([]);
        setLastFetchedCourseId(selectedCourse._id);
      }
    } else {
      setModules([]);
      setSelectedModule(null);
      setLessons([]);
      setLastFetchedCourseId(null);
    }
  }, [selectedCourse, lastFetchedCourseId, fetchModules]);

  useEffect(() => {
    if (selectedModule) {
      if (selectedModule._id !== lastFetchedModuleId) {
        fetchLessons(selectedModule._id);
        setLastFetchedModuleId(selectedModule._id);
      }
    } else {
      setLessons([]);
      setLastFetchedModuleId(null);
    }
  }, [selectedModule, lastFetchedModuleId, fetchLessons]);

  // Helper file upload handler
  const uploadFile = async (file) => {
    if (!file) return '';
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        return data.file_url;
      } else {
        alert(data.message || 'File upload failed');
        return '';
      }
    } catch (err) {
      console.error('Upload communication error', err);
      return '';
    }
  };

  // Create course submit
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('Course created successfully!');
        fetchCourses();
        setActiveModal(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit course submit
  const handleCourseEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/courses/${editingCourse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editCourseForm)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('Course updated successfully!');
        fetchCourses();
        setSelectedCourse(data.course);
        setEditingCourse(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete course
  const handleCourseDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course and all its syllabus modules/lessons?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Course deleted successfully!');
        setSelectedCourse(null);
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create module submit
  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/courses/${selectedCourse._id}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(moduleForm)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('Module created successfully!');
        fetchModules(selectedCourse._id);
        setActiveModal(null);
        setModuleForm({ title: '', order: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Create lesson submit
  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModule || !selectedCourse) return;
    setSubmitting(true);
    setUploading(true);
    
    try {
      let finalVideoUrl = lessonForm.videoUrl;
      let finalPdfUrl = lessonForm.notesUrl;
      let finalCodeUrl = lessonForm.sourceCodeUrl;
      let finalFilesUrl = lessonForm.projectUrl;

      // 1. Upload files first if source is 'upload'
      if (lessonForm.videoSource === 'upload') {
        if (selectedVideo) {
          const url = await uploadFile(selectedVideo);
          if (url) finalVideoUrl = url;
        } else {
          finalVideoUrl = lessonForm.video_url;
        }
      }
      
      if (lessonForm.notesSource === 'upload') {
        if (selectedPdf) {
          const url = await uploadFile(selectedPdf);
          if (url) finalPdfUrl = url;
        } else {
          finalPdfUrl = lessonForm.pdf_url;
        }
      }

      if (lessonForm.sourceCodeSource === 'upload') {
        if (selectedZip) {
          const url = await uploadFile(selectedZip);
          if (url) finalCodeUrl = url;
        } else {
          finalCodeUrl = lessonForm.code_url;
        }
      }

      if (lessonForm.projectSource === 'upload') {
        if (selectedFiles) {
          const url = await uploadFile(selectedFiles);
          if (url) finalFilesUrl = url;
        } else {
          finalFilesUrl = lessonForm.files_url;
        }
      }

      const payload = {
        ...lessonForm,
        course_id: selectedCourse._id,
        video_url: finalVideoUrl,
        videoUrl: finalVideoUrl,
        pdf_url: finalPdfUrl,
        pdfUrl: finalPdfUrl,
        notesUrl: finalPdfUrl,
        code_url: finalCodeUrl,
        codeUrl: finalCodeUrl,
        sourceCodeUrl: finalCodeUrl,
        files_url: finalFilesUrl,
        filesUrl: finalFilesUrl,
        projectUrl: finalFilesUrl
      };

      // 2. Submit lesson metadata
      const res = await fetch(`${apiUrl}/api/modules/${selectedModule._id}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('Lesson created successfully!');
        fetchLessons(selectedModule._id);
        setActiveModal(null);
        setLessonForm({
          title: '',
          description: '',
          video_url: '',
          pdf_url: '',
          code_url: '',
          files_url: '',
          videoSource: 'upload',
          videoUrl: '',
          notesSource: 'upload',
          notesUrl: '',
          sourceCodeSource: 'upload',
          sourceCodeUrl: '',
          projectSource: 'upload',
          projectUrl: '',
          order: 0
        });
        setSelectedVideo(null);
        setSelectedPdf(null);
        setSelectedZip(null);
        setSelectedFiles(null);
      } else {
        alert(data.message || 'Failed to create lesson');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating lesson');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // Edit module submit
  const handleModuleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingModule || !selectedCourse) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/modules/${editingModule._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editModuleForm)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('Module updated successfully!');
        fetchModules(selectedCourse._id);
        setEditingModule(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete module
  const handleModuleDelete = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module and all its lessons?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Module deleted successfully!');
        setSelectedModule(null);
        if (selectedCourse) {
          fetchModules(selectedCourse._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit lesson submit
  const handleLessonEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLesson || !selectedModule) return;
    setSubmitting(true);
    setUploading(true);
    
    try {
      let finalVideoUrl = editLessonForm.videoUrl;
      let finalPdfUrl = editLessonForm.notesUrl;
      let finalCodeUrl = editLessonForm.sourceCodeUrl;
      let finalFilesUrl = editLessonForm.projectUrl;

      // 1. Upload files if selected and source is upload
      if (editLessonForm.videoSource === 'upload') {
        if (selectedVideo) {
          const url = await uploadFile(selectedVideo);
          if (url) finalVideoUrl = url;
        } else {
          finalVideoUrl = editLessonForm.video_url;
        }
      }
      
      if (editLessonForm.notesSource === 'upload') {
        if (selectedPdf) {
          const url = await uploadFile(selectedPdf);
          if (url) finalPdfUrl = url;
        } else {
          finalPdfUrl = editLessonForm.pdf_url;
        }
      }

      if (editLessonForm.sourceCodeSource === 'upload') {
        if (selectedZip) {
          const url = await uploadFile(selectedZip);
          if (url) finalCodeUrl = url;
        } else {
          finalCodeUrl = editLessonForm.code_url;
        }
      }

      if (editLessonForm.projectSource === 'upload') {
        if (selectedFiles) {
          const url = await uploadFile(selectedFiles);
          if (url) finalFilesUrl = url;
        } else {
          finalFilesUrl = editLessonForm.files_url;
        }
      }

      const payload = {
        ...editLessonForm,
        video_url: finalVideoUrl,
        videoUrl: finalVideoUrl,
        pdf_url: finalPdfUrl,
        pdfUrl: finalPdfUrl,
        notesUrl: finalPdfUrl,
        code_url: finalCodeUrl,
        codeUrl: finalCodeUrl,
        sourceCodeUrl: finalCodeUrl,
        files_url: finalFilesUrl,
        filesUrl: finalFilesUrl,
        projectUrl: finalFilesUrl
      };

      // 2. Submit updated metadata
      const res = await fetch(`${apiUrl}/api/lessons/${editingLesson._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert('Lesson updated successfully!');
        fetchLessons(selectedModule._id);
        setEditingLesson(null);
        setSelectedVideo(null);
        setSelectedPdf(null);
        setSelectedZip(null);
        setSelectedFiles(null);
      } else {
        alert(data.message || 'Failed to update lesson');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating lesson');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // Delete lesson
  const handleLessonDelete = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Lesson deleted successfully!');
        if (selectedModule) {
          fetchLessons(selectedModule._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-6">
        <div className="text-left">
          <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Levlox Course Management</h3>
          <p className="text-xs text-gray-500">Design syllabus structures, build course modules, and upload strategic media lessons.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            adminProfile={adminProfile}
            user={user}
            onCsv={handleExportCSV}
            onExcel={handleExportExcel}
            onPdf={handleExportPDF}
            fileNamePrefix="courses_export"
          />
          <button 
            onClick={() => setActiveModal('course')}
            className="flex items-center gap-1.5 bg-black text-white hover:bg-zinc-800 transition-all px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
          >
            <Plus size={14} /> Add New Course
          </button>
        </div>
      </div>

      {/* Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        {/* COLUMN 1: SELECT COURSE */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <BookOpen size={16} /> Course List
            </h4>
            <span className="text-[10px] text-gray-400 font-semibold">{courses.length} Courses</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {coursesLoading ? (
              <p className="text-xs text-gray-400 text-center py-6">Loading courses...</p>
            ) : courses.length > 0 ? (
              courses.map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCourse(c)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                    selectedCourse?._id === c._id 
                      ? 'border-black bg-zinc-50 font-bold' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="truncate text-left flex flex-col items-start gap-1">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[8px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider">
                        {c.category || 'General'}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider ${
                        c.pathwayType === 'company' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {c.pathwayType === 'company' ? 'Company' : 'Career'}
                      </span>
                    </div>
                    <h5 className="text-xs font-black text-gray-900 truncate w-full">{c.title}</h5>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No courses found. Add a course to start building syllabus decks.</p>
            )}
          </div>
        </div>

        {/* COLUMN 2: MANAGE MODULES */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          {selectedCourse && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-gray-100 mb-2 space-y-2">
              <div>
                <h5 className="text-xs font-bold text-gray-900">{selectedCourse.title}</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">{selectedCourse.desc || 'No description'}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {selectedCourse.is_career_pathway && <span className="text-[8px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-extrabold uppercase">Career Pathway</span>}
                  <span className="text-[8px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded font-extrabold uppercase">{selectedCourse.status || 'active'}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditingCourse(selectedCourse);
                    setEditCourseForm({
                      title: selectedCourse.title || '',
                      subtitle: selectedCourse.subtitle || '',
                      category: selectedCourse.category || 'Placement',
                      desc: selectedCourse.desc || '',
                      duration: selectedCourse.duration || '10 hrs duration',
                      level: selectedCourse.level || 'All Levels',
                      badge: selectedCourse.badge || 'FREE',
                      badgeClass: selectedCourse.badgeClass || 'badge-free',
                      price: selectedCourse.price || 'Free Access',
                      tab: selectedCourse.tab || 'Placement',
                      thumbBg: selectedCourse.thumbBg || 'c-thumb-1',
                      thumbIcon: selectedCourse.thumbIcon || '🏢',
                      is_career_pathway: !!selectedCourse.is_career_pathway,
                      is_featured: !!selectedCourse.is_featured,
                      display_order: selectedCourse.display_order ?? selectedCourse.displayOrder ?? 999,
                      pathwayType: selectedCourse.pathwayType || 'career',
                      status: selectedCourse.status || 'active'
                    });
                  }}
                  className="text-[10px] bg-black text-white hover:bg-zinc-850 px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
                >
                  Edit Course
                </button>
                <button
                  onClick={() => handleCourseDelete(selectedCourse._id)}
                  className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
                >
                  Delete Course
                </button>
              </div>
            </div>
          )}
          {selectedModule && (
            <div className="bg-zinc-50 p-4 rounded-2xl border border-gray-100 mb-2 space-y-2">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Selected Module</span>
                <h5 className="text-xs font-bold text-gray-900">{selectedModule.title}</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Order: {selectedModule.order}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditingModule(selectedModule);
                    setEditModuleForm({
                      title: selectedModule.title || '',
                      order: selectedModule.order || 0
                    });
                  }}
                  className="text-[10px] bg-black text-white hover:bg-zinc-850 px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
                >
                  Edit Module
                </button>
                <button
                  onClick={() => handleModuleDelete(selectedModule._id)}
                  className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
                >
                  Delete Module
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">

            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <FolderPlus size={16} /> Course Modules
            </h4>
            {selectedCourse && (
              <button 
                onClick={() => setActiveModal('module')}
                className="text-xs bg-zinc-150 hover:bg-zinc-200 text-black px-3 py-1 rounded-lg font-bold"
              >
                + Module
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {selectedCourse ? (
              modulesLoading ? (
                <p className="text-xs text-gray-400 text-center py-6">Loading modules...</p>
              ) : modules.length > 0 ? (
                modules.map((m, idx) => (
                  <button
                    key={m._id}
                    onClick={() => setSelectedModule(m)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                      selectedModule?._id === m._id 
                        ? 'border-black bg-zinc-50 font-bold' 
                        : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Module {idx + 1}</span>
                      <h5 className="text-xs font-black text-gray-900 mt-0.5">{m.title}</h5>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 shrink-0" />
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">No modules created yet. Add a module for this course.</p>
              )
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">Select a course to view or add modules.</p>
            )}
          </div>
        </div>

        {/* COLUMN 3: MANAGE LESSONS */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <FilePlus size={16} /> Module Lessons
            </h4>
            {selectedModule && (
              <button 
                onClick={() => setActiveModal('lesson')}
                className="text-xs bg-zinc-150 hover:bg-zinc-200 text-black px-3 py-1 rounded-lg font-bold"
              >
                + Lesson
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {selectedModule ? (
              lessonsLoading ? (
                <p className="text-xs text-gray-400 text-center py-6">Loading lessons...</p>
              ) : lessons.length > 0 ? (
                lessons.map(l => (
                  <div key={l._id} className="p-4 border border-gray-150 rounded-2xl space-y-2">
                    <h5 className="text-xs font-extrabold text-gray-900">{l.title}</h5>
                    <p className="text-[11px] text-gray-400 truncate">{l.description}</p>
                    
                    {/* Media attachments indicators */}
                    <div className="flex items-center gap-2 pt-1">
                      {l.video_url && <span className="text-[9px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"><Video size={8} /> Video</span>}
                      {l.pdf_url && <span className="text-[9px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"><FileText size={8} /> PDF</span>}
                      {(l.code_url || l.files_url) && <span className="text-[9px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"><Download size={8} /> Source</span>}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-50 mt-2">
                      <button
                        onClick={() => {
                          setEditingLesson(l);
                          setEditLessonForm({
                            title: l.title || '',
                            description: l.description || '',
                            video_url: l.video_url || '',
                            pdf_url: l.pdf_url || '',
                            code_url: l.code_url || '',
                            files_url: l.files_url || '',
                            pdf_file: l.pdf_file || '',
                            notes_file: l.notes_file || '',
                            assignment_file: l.assignment_file || '',
                            resources_file: l.resources_file || '',
                            videoSource: l.videoSource || ((l.videoUrl || l.video_url || '').startsWith('http') && !(l.video_url || '').includes('/uploads/') && !(l.video_url || '').includes('/api/') ? 'url' : 'upload'),
                            videoUrl: l.videoUrl || l.video_url || '',
                            notesSource: l.notesSource || ((l.notesUrl || l.pdf_url || '').startsWith('http') && !(l.pdf_url || '').includes('/uploads/') && !(l.pdf_url || '').includes('/api/') ? 'url' : 'upload'),
                            notesUrl: l.notesUrl || l.pdf_url || '',
                            sourceCodeSource: l.sourceCodeSource || ((l.sourceCodeUrl || l.code_url || '').startsWith('http') && !(l.code_url || '').includes('/uploads/') ? 'url' : 'upload'),
                            sourceCodeUrl: l.sourceCodeUrl || l.code_url || '',
                            projectSource: l.projectSource || ((l.projectUrl || l.files_url || '').startsWith('http') && !(l.files_url || '').includes('/uploads/') ? 'url' : 'upload'),
                            projectUrl: l.projectUrl || l.files_url || '',
                            order: l.order || 0
                          });
                        }}
                        className="text-[9px] bg-black text-white px-2 py-1 rounded font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleLessonDelete(l._id)}
                        className="text-[9px] bg-red-600 text-white px-2 py-1 rounded font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">No lessons built yet. Add lessons to populate the course syllabus.</p>
              )
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">Select a module to manage or add lessons.</p>
            )}
          </div>
        </div>

      </div>

      {/* CREATE COURSE MODAL */}
      {activeModal === 'course' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left border border-gray-100 my-8 max-h-[90vh] overflow-y-auto">
            <h4 className="font-extrabold text-gray-900 text-lg mb-6">Create New Course Portal</h4>
            
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none"
                  placeholder="e.g. 🎯 Full Stack Web Development System"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Course Subtitle / Tagline</label>
                <input
                  type="text"
                  value={courseForm.subtitle}
                  onChange={(e) => setCourseForm({...courseForm, subtitle: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none"
                  placeholder="e.g. The Hiring Formula"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category Tag</label>
                <select
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({...courseForm, category: e.target.value, tab: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                >
                  <option value="Placement">Placement</option>
                  <option value="Career Growth">Career Growth</option>
                  <option value="Mindset">Mindset</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Course Description</label>
                <textarea
                  value={courseForm.desc}
                  onChange={(e) => setCourseForm({...courseForm, desc: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none h-16 resize-none"
                  placeholder="Summarize course goals..."
                />
              </div>

              <div className="flex flex-wrap gap-4 py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create-is-career-pathway"
                    checked={courseForm.is_career_pathway}
                    onChange={(e) => setCourseForm({...courseForm, is_career_pathway: e.target.checked})}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label htmlFor="create-is-career-pathway" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Is Career Pathway?
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create-is-featured"
                    checked={courseForm.is_featured}
                    onChange={(e) => setCourseForm({...courseForm, is_featured: e.target.checked})}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label htmlFor="create-is-featured" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Is Featured (Highlight Card)?
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Display Order</label>
                  <input
                    type="number"
                    value={courseForm.display_order}
                    onChange={(e) => setCourseForm({...courseForm, display_order: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                    placeholder="e.g. 1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pathway Type</label>
                  <select
                    value={courseForm.pathwayType}
                    onChange={(e) => setCourseForm({
                      ...courseForm, 
                      pathwayType: e.target.value,
                      is_career_pathway: e.target.value === 'career'
                    })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                  >
                    <option value="career">Career Pathway</option>
                    <option value="company">Company Pathway</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Badge Text</label>
                <input
                  type="text"
                  value={courseForm.badge}
                  onChange={(e) => setCourseForm({...courseForm, badge: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                  placeholder="e.g. FREE, Premium, New"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</label>
                <select
                  value={courseForm.status}
                  onChange={(e) => setCourseForm({...courseForm, status: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                >
                  <option value="active">Active</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                {submitting ? 'Creating Course...' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingCourse(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left border border-gray-100 my-8 max-h-[90vh] overflow-y-auto">
            <h4 className="font-extrabold text-gray-900 text-lg mb-6">Edit Course Portal</h4>
            
            <form onSubmit={handleCourseEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Course Title</label>
                <input
                  type="text"
                  required
                  value={editCourseForm.title}
                  onChange={(e) => setEditCourseForm({...editCourseForm, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Course Subtitle / Tagline</label>
                <input
                  type="text"
                  value={editCourseForm.subtitle}
                  onChange={(e) => setEditCourseForm({...editCourseForm, subtitle: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category Tag</label>
                <select
                  value={editCourseForm.category}
                  onChange={(e) => setEditCourseForm({...editCourseForm, category: e.target.value, tab: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                >
                  <option value="Placement">Placement</option>
                  <option value="Career Growth">Career Growth</option>
                  <option value="Mindset">Mindset</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Course Description</label>
                <textarea
                  value={editCourseForm.desc}
                  onChange={(e) => setEditCourseForm({...editCourseForm, desc: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none h-16 resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-is-career-pathway"
                    checked={editCourseForm.is_career_pathway}
                    onChange={(e) => setEditCourseForm({...editCourseForm, is_career_pathway: e.target.checked})}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label htmlFor="edit-is-career-pathway" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Is Career Pathway?
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-is-featured"
                    checked={editCourseForm.is_featured}
                    onChange={(e) => setEditCourseForm({...editCourseForm, is_featured: e.target.checked})}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label htmlFor="edit-is-featured" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Is Featured (Highlight Card)?
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Display Order</label>
                  <input
                    type="number"
                    value={editCourseForm.display_order}
                    onChange={(e) => setEditCourseForm({...editCourseForm, display_order: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pathway Type</label>
                  <select
                    value={editCourseForm.pathwayType}
                    onChange={(e) => setEditCourseForm({
                      ...editCourseForm, 
                      pathwayType: e.target.value,
                      is_career_pathway: e.target.value === 'career'
                    })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                  >
                    <option value="career">Career Pathway</option>
                    <option value="company">Company Pathway</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Badge Text</label>
                <input
                  type="text"
                  value={editCourseForm.badge}
                  onChange={(e) => setEditCourseForm({...editCourseForm, badge: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</label>
                <select
                  value={editCourseForm.status}
                  onChange={(e) => setEditCourseForm({...editCourseForm, status: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                >
                  <option value="active">Active</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                {submitting ? 'Updating Course...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODULE MODAL */}
      {activeModal === 'module' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left border border-gray-100">
            <h4 className="font-extrabold text-gray-900 text-lg mb-6">Create New Module</h4>
            
            <form onSubmit={handleModuleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Module Title</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none"
                  placeholder="e.g. Introduction to Next.js Routes"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Display Order</label>
                <input
                  type="number"
                  required
                  value={moduleForm.order}
                  onChange={(e) => setModuleForm({...moduleForm, order: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                {submitting ? 'Creating Module...' : 'Create Module'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LESSON MODAL */}
      {activeModal === 'lesson' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl z-10 text-left border border-gray-100 my-8">
            <h4 className="font-extrabold text-gray-900 text-lg mb-6">Create Lesson & Upload Resources</h4>
            
            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                  placeholder="e.g. Setting up MongoDB and PyMongo Connect"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description / Goal</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none h-16 resize-none"
                  placeholder="What will students learn in this video?"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Display Order</label>
                <input
                  type="number"
                  required
                  value={lessonForm.order}
                  onChange={(e) => setLessonForm({...lessonForm, order: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              {/* Uploads Section */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Syllabus Media Assets & URLs</h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* ── Lesson Video ── */}
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Lesson Video</label>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        {['url', 'upload'].map(src => (
                          <button key={src} type="button"
                            onClick={() => setLessonForm({...lessonForm, videoSource: src})}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                              lessonForm.videoSource === src ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                            }`}>{src === 'url' ? 'URL' : 'Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {lessonForm.videoSource === 'url' ? (
                      <input type="text" value={lessonForm.videoUrl}
                        onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                        placeholder="YouTube / Vimeo / MP4 URL..."
                        className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-[11px] outline-none"
                      />
                    ) : (
                      <input type="file" accept="video/*"
                        onChange={(e) => setSelectedVideo(e.target.files[0])}
                        className="text-[10px] text-gray-500 w-full mt-1"
                      />
                    )}
                    {selectedVideo && lessonForm.videoSource === 'upload' && (
                      <p className="text-[9px] text-gray-500 truncate">{selectedVideo.name}</p>
                    )}
                  </div>

                  {/* ── Lecture Notes ── */}
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Lecture Notes (PDF)</label>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        {['url', 'upload'].map(src => (
                          <button key={src} type="button"
                            onClick={() => setLessonForm({...lessonForm, notesSource: src})}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                              lessonForm.notesSource === src ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                            }`}>{src === 'url' ? 'URL' : 'Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {lessonForm.notesSource === 'url' ? (
                      <input type="text" value={lessonForm.notesUrl}
                        onChange={(e) => setLessonForm({...lessonForm, notesUrl: e.target.value})}
                        placeholder="External PDF / Google Drive URL..."
                        className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-[11px] outline-none"
                      />
                    ) : (
                      <input type="file" accept=".pdf"
                        onChange={(e) => setSelectedPdf(e.target.files[0])}
                        className="text-[10px] text-gray-500 w-full mt-1"
                      />
                    )}
                    {selectedPdf && lessonForm.notesSource === 'upload' && (
                      <p className="text-[9px] text-gray-500 truncate">{selectedPdf.name}</p>
                    )}
                  </div>

                  {/* ── Source Code ── */}
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Source Code</label>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        {['url', 'upload'].map(src => (
                          <button key={src} type="button"
                            onClick={() => setLessonForm({...lessonForm, sourceCodeSource: src})}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                              lessonForm.sourceCodeSource === src ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                            }`}>{src === 'url' ? 'GitHub URL' : 'ZIP Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {lessonForm.sourceCodeSource === 'url' ? (
                      <input type="text" value={lessonForm.sourceCodeUrl}
                        onChange={(e) => setLessonForm({...lessonForm, sourceCodeUrl: e.target.value})}
                        placeholder="https://github.com/user/repo"
                        className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-[11px] outline-none"
                      />
                    ) : (
                      <input type="file" accept=".zip"
                        onChange={(e) => setSelectedZip(e.target.files[0])}
                        className="text-[10px] text-gray-500 w-full mt-1"
                      />
                    )}
                    {selectedZip && lessonForm.sourceCodeSource === 'upload' && (
                      <p className="text-[9px] text-gray-500 truncate">{selectedZip.name}</p>
                    )}
                  </div>

                  {/* ── Project Files ── */}
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Project Files</label>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        {['url', 'upload'].map(src => (
                          <button key={src} type="button"
                            onClick={() => setLessonForm({...lessonForm, projectSource: src})}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                              lessonForm.projectSource === src ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                            }`}>{src === 'url' ? 'Drive/URL' : 'ZIP Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {lessonForm.projectSource === 'url' ? (
                      <input type="text" value={lessonForm.projectUrl}
                        onChange={(e) => setLessonForm({...lessonForm, projectUrl: e.target.value})}
                        placeholder="Google Drive / Dropbox / OneDrive URL..."
                        className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-[11px] outline-none"
                      />
                    ) : (
                      <input type="file" accept=".zip"
                        onChange={(e) => setSelectedFiles(e.target.files[0])}
                        className="text-[10px] text-gray-500 w-full mt-1"
                      />
                    )}
                    {selectedFiles && lessonForm.projectSource === 'upload' && (
                      <p className="text-[9px] text-gray-500 truncate">{selectedFiles.name}</p>
                    )}
                  </div>

                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                {uploading ? 'Uploading Media Files...' : submitting ? 'Saving Lesson Details...' : 'Create Lesson & Upload'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* EDIT MODULE MODAL */}
      {editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingModule(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 text-left border border-gray-100">
            <h4 className="font-extrabold text-gray-900 text-lg mb-6">Edit Module</h4>
            
            <form onSubmit={handleModuleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Module Title</label>
                <input
                  type="text"
                  required
                  value={editModuleForm.title}
                  onChange={(e) => setEditModuleForm({...editModuleForm, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Display Order</label>
                <input
                  type="number"
                  required
                  value={editModuleForm.order}
                  onChange={(e) => setEditModuleForm({...editModuleForm, order: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                {submitting ? 'Updating Module...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LESSON MODAL */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingLesson(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl z-10 text-left border border-gray-100 my-8 max-h-[90vh] overflow-y-auto">
            <h4 className="font-extrabold text-gray-900 text-lg mb-6">Edit Lesson</h4>
            
            <form onSubmit={handleLessonEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={editLessonForm.title}
                  onChange={(e) => setEditLessonForm({...editLessonForm, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description / Goal</label>
                <textarea
                  value={editLessonForm.description}
                  onChange={(e) => setEditLessonForm({...editLessonForm, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none h-16 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Display Order</label>
                <input
                  type="number"
                  required
                  value={editLessonForm.order}
                  onChange={(e) => setEditLessonForm({...editLessonForm, order: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none"
                />
              </div>

              {/* Uploads Section */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Syllabus Media Assets & URLs</h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* ── Lesson Video ── */}
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Lesson Video</label>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        {['url', 'upload'].map(src => (
                          <button key={src} type="button"
                            onClick={() => setEditLessonForm({...editLessonForm, videoSource: src})}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                              editLessonForm.videoSource === src ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                            }`}>{src === 'url' ? 'URL' : 'Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {editLessonForm.videoSource === 'url' ? (
                      <input type="text" value={editLessonForm.videoUrl}
                        onChange={(e) => setEditLessonForm({...editLessonForm, videoUrl: e.target.value})}
                        placeholder="YouTube / Vimeo / MP4 URL..."
                        className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-[11px] outline-none"
                      />
                    ) : (
                      <input type="file" accept="video/*"
                        onChange={(e) => setSelectedVideo(e.target.files[0])}
                        className="text-[10px] text-gray-500 w-full mt-1"
                      />
                    )}
                    {selectedVideo && editLessonForm.videoSource === 'upload' && (
                      <p className="text-[9px] text-gray-500 truncate">{selectedVideo.name}</p>
                    )}
                  </div>

                  {/* ── Lecture Notes ── */}
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Lecture Notes (PDF)</label>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        {['url', 'upload'].map(src => (
                          <button key={src} type="button"
                            onClick={() => setEditLessonForm({...editLessonForm, notesSource: src})}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                              editLessonForm.notesSource === src ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                            }`}>{src === 'url' ? 'URL' : 'Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {editLessonForm.notesSource === 'url' ? (
                      <input type="text" value={editLessonForm.notesUrl}
                        onChange={(e) => setEditLessonForm({...editLessonForm, notesUrl: e.target.value})}
                        placeholder="External PDF / Google Drive URL..."
                        className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-[11px] outline-none"
                      />
                    ) : (
                      <input type="file" accept=".pdf"
                        onChange={(e) => setSelectedPdf(e.target.files[0])}
                        className="text-[10px] text-gray-500 w-full mt-1"
                      />
                    )}
                    {selectedPdf && editLessonForm.notesSource === 'upload' && (
                      <p className="text-[9px] text-gray-500 truncate">{selectedPdf.name}</p>
                    )}
                  </div>

                  {/* ── Source Code ── */}
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Source Code</label>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        {['url', 'upload'].map(src => (
                          <button key={src} type="button"
                            onClick={() => setEditLessonForm({...editLessonForm, sourceCodeSource: src})}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                              editLessonForm.sourceCodeSource === src ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                            }`}>{src === 'url' ? 'GitHub URL' : 'ZIP Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {editLessonForm.sourceCodeSource === 'url' ? (
                      <input type="text" value={editLessonForm.sourceCodeUrl}
                        onChange={(e) => setEditLessonForm({...editLessonForm, sourceCodeUrl: e.target.value})}
                        placeholder="https://github.com/user/repo"
                        className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-[11px] outline-none"
                      />
                    ) : (
                      <input type="file" accept=".zip"
                        onChange={(e) => setSelectedZip(e.target.files[0])}
                        className="text-[10px] text-gray-500 w-full mt-1"
                      />
                    )}
                    {selectedZip && editLessonForm.sourceCodeSource === 'upload' && (
                      <p className="text-[9px] text-gray-500 truncate">{selectedZip.name}</p>
                    )}
                  </div>

                  {/* ── Project Files ── */}
                  <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Project Files</label>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg">
                        {['url', 'upload'].map(src => (
                          <button key={src} type="button"
                            onClick={() => setEditLessonForm({...editLessonForm, projectSource: src})}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                              editLessonForm.projectSource === src ? 'bg-white text-black shadow-sm' : 'text-gray-500'
                            }`}>{src === 'url' ? 'Drive/URL' : 'ZIP Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {editLessonForm.projectSource === 'url' ? (
                      <input type="text" value={editLessonForm.projectUrl}
                        onChange={(e) => setEditLessonForm({...editLessonForm, projectUrl: e.target.value})}
                        placeholder="Google Drive / Dropbox / OneDrive URL..."
                        className="w-full bg-white border border-gray-150 rounded-xl px-3 py-1.5 text-[11px] outline-none"
                      />
                    ) : (
                      <input type="file" accept=".zip"
                        onChange={(e) => setSelectedFiles(e.target.files[0])}
                        className="text-[10px] text-gray-500 w-full mt-1"
                      />
                    )}
                    {selectedFiles && editLessonForm.projectSource === 'upload' && (
                      <p className="text-[9px] text-gray-500 truncate">{selectedFiles.name}</p>
                    )}
                  </div>

                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer mt-4"
              >
                {uploading ? 'Uploading Media Files...' : submitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseManagementView;
