"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Package,
  Layout,
  FileText,
  Save,
  Loader2,
  X,
  Boxes,
  Tag,
  Upload,
} from "lucide-react";
import { ImportModal } from "@/components/admin/ImportModal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/store/store";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  bulkImportCategories,
  fetchCategories,
} from "@/lib/store/categories/categoriesThunk";

type CategoryType = "product" | "portfolio" | "blog";

type CategoryRecord = {
  _id?: string;
  name?: string;
  title?: string;
  slug: string;
  type: CategoryType;
  parentId?: string | null;
  description?: string;
  entityCount?: number;
  pageStatus?: string;
  bannerImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
};

type CategoryDraft = {
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
  description: string;
  pageStatus: string;
  bannerImageUrl: string;
  metaTitle: string;
  metaDescription: string;
};

function createDraft(type: CategoryType = "product"): CategoryDraft {
  return {
    name: "",
    slug: "",
    type,
    parentId: null,
    description: "",
    pageStatus: "published",
    bannerImageUrl: "",
    metaTitle: "",
    metaDescription: "",
  };
}

function toDraft(record: CategoryRecord): CategoryDraft {
  return {
    name: record.name || record.title || "",
    slug: record.slug || "",
    type: record.type || "product",
    parentId: record.parentId || null,
    description: record.description || "",
    pageStatus: record.pageStatus || "published",
    bannerImageUrl: record.bannerImageUrl || "",
    metaTitle: record.metaTitle || "",
    metaDescription: record.metaDescription || "",
  };
}

export default function CategoriesPage() {
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CategoryType | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryDraft>(createDraft());
  const [showImportModal, setShowImportModal] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { allCategories: categories, categoryLoading: loading } = useSelector(
    (state: RootState) => state.adminCategories,
  );

  const dispatch = useDispatch<AppDispatch>();

  const resetForm = () => {
    setForm(createDraft(typeFilter || "product"));
    setEditingId(null);
    setShowForm(false);
  };

  const totals = useMemo(
    () => ({
      all: categories.length,
      product: categories.filter((item) => item.type === "product").length,
      portfolio: categories.filter((item) => item.type === "portfolio").length,
      blog: categories.filter((item) => item.type === "blog").length,
    }),
    [categories],
  );

  const openCreate = (parentId: string | null = null) => {
    setForm({ ...createDraft(typeFilter || "product"), parentId });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (record: CategoryRecord) => {
    setForm(toDraft(record));
    setEditingId(record._id!);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = toDraft(form);
    if (!payload.name) {
      toast.error("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await dispatch(updateCategory({ id: editingId, payload })).unwrap();
        toast.success("Category updated!");
      } else {
        await dispatch(createCategory(payload)).unwrap();
        toast.success("Category created!");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: CategoryRecord) => {
    console.log(record);
    if (!confirm(`Delete category "${record.name}"?`)) return;
    try {
      await dispatch(deleteCategory(record._id!)).unwrap();
      toast.success("Category deleted!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete category.");
    }
  };

  const handleImport = async (data: any[]) => {
    const resultAction = await dispatch(bulkImportCategories(data));
    if (bulkImportCategories.fulfilled.match(resultAction)) {
      dispatch(fetchCategories());
      return resultAction.payload;
    } else {
      throw new Error((resultAction.payload as any)?.message || "Import failed");
    }
  };

  const categorySampleData = [
    {
      name: "Smart Home",
      slug: "smart-home",
      type: "product",
      description: "Devices for home automation and security.",
      pageStatus: "published",
      metaTitle: "Shop Smart Home Devices",
      metaDescription: "Find the best deals on smart home hubs, cameras, and lights."
    }
  ];

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedNodes(newSet);
  };

  // Build Hierarchy
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const lowerQuery = searchQuery.toLowerCase();
    return categories.filter((c) => {
      const n = c.title || "";
      return (
        n.toLowerCase().includes(lowerQuery) ||
        c.slug.toLowerCase().includes(lowerQuery)
      );
    });
  }, [categories, searchQuery]);

  const tree = useMemo(() => {
    const map = new Map<string, CategoryRecord & { children: any[] }>();
    const roots: any[] = [];

    filteredCategories.forEach((c) => {
      if (c._id) {
        map.set(c._id, { ...c, children: [] });
      }
    });

    map.forEach((c) => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(c);
      } else {
        roots.push(c);
      }
    });

    return roots;
  }, [filteredCategories]);

  // Recursively render tree nodes as flat table rows
  const renderRows = (nodes: any[], depth: number = 0): React.ReactNode[] => {
    return nodes.flatMap((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedNodes.has(node._id!) || searchQuery.length > 0;
      const name = node.name || node.title || "Unnamed Category";

      const row = (
        <TableRow
          key={node._id}
          className={`group ${depth === 0 ? "bg-card hover:bg-accent/5" : "bg-muted/5 hover:bg-accent/10"}`}
        >
          <TableCell
            className="w-full sm:w-[50%]"
            style={{ paddingLeft: `${depth * 2 + 1}rem` }}
          >
            <div className="flex items-center gap-3">
              {hasChildren ? (
                <button
                  onClick={(e) => toggleExpand(node._id!, e)}
                  className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${isExpanded ? "bg-primary/10 text-primary" : "bg-muted hover:bg-muted-foreground/30 text-muted-foreground"}`}
                >
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                </div>
              )}

              <div
                className={`flex items-center justify-center w-8 h-8 rounded-lg ${depth === 0 ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"}`}
              >
                <FolderTree size={16} />
              </div>

              <div className="flex flex-col">
                <span
                  className={`font-semibold text-foreground ${depth === 0 ? "text-[15px]" : "text-[14px]"}`}
                >
                  {name}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  /{node.slug}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell>
            {depth === 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                Root Level
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-widest border border-border">
                Level {depth + 1}
              </span>
            )}
          </TableCell>
          <TableCell>
            <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[10px] font-bold border border-primary/10">
              {node.children.length}{" "}
              {node.children.length === 1 ? "Item" : "Items"}
            </span>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-muted"
                onClick={() => openCreate(node._id!)}
                title="Add Subcategory"
              >
                <Plus size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted"
                onClick={() => openEdit(node)}
                title="Edit Category"
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(node)}
                title="Delete Category"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );

      if (isExpanded && hasChildren) {
        return [row, ...renderRows(node.children, depth + 1)];
      }

      return [row];
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 sm:p-8 max-w-[1400px] mx-auto">
      {/* Header & Stats Banner */}
      <div className="grid lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Category Management
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Organize your store's taxonomy with our premium hierarchy matrix.
            Top-level categories act as main navigational nodes, while nested
            items create structured sub-menus.
          </p>
        </div>

        <div className="flex justify-end lg:col-span-1 gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="h-11 px-6 font-bold shadow-sm gap-2 rounded-xl transition-all border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Upload size={16} /> Import JSON
          </Button>
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImport}
            sampleData={categorySampleData}
            title="Import Categories"
            description="Upload a JSON file containing category records. Existing slugs will be skipped."
            fileName="categories"
          />
          <Button
            onClick={() => openCreate(null)}
            className="h-11 px-6 font-bold shadow-md gap-2 rounded-xl transition-all hover:scale-[1.02]"
          >
            <Plus size={16} /> Add Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-muted/20 border-border/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">
                Total Hubs
              </p>
              <p className="text-3xl font-black text-foreground">
                {totals.all}
              </p>
            </div>
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Boxes size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-primary/70 mb-1">
                Products
              </p>
              <p className="text-3xl font-black text-primary">
                {totals.product}
              </p>
            </div>
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-purple-500/5 border-purple-500/20 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-purple-400 mb-1">
                Portfolio
              </p>
              <p className="text-3xl font-black text-purple-500">
                {totals.portfolio}
              </p>
            </div>
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Layout size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-amber-500/5 border-amber-500/20 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-amber-500 mb-1">
                Blog
              </p>
              <p className="text-3xl font-black text-amber-600">
                {totals.blog}
              </p>
            </div>
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <FileText size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor Form Modal/Inline */}
      {showForm && (
        <Card className="border-border/60 shadow-xl relative overflow-hidden rounded-2xl p-1 bg-gradient-to-b from-card to-surface pb-0 animate-in fade-in slide-in-from-top-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary/50" />
          <CardHeader className="pt-6 pb-4 px-6 border-b border-border/40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Tag size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">
                    {editingId
                      ? "Edit Category Details"
                      : "Create New Category"}
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    Define the name, path, and precise hierarchical placement.
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetForm}
                className="h-10 w-10 bg-muted/50 hover:bg-muted rounded-full"
              >
                <X size={18} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-8 bg-card/50">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Category Name
                  </Label>
                  <Input
                    placeholder="e.g. Modern Sofas"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="h-12 border-border/80 bg-surface focus-visible:ring-primary/30 text-base"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    URL Slug / Path
                  </Label>
                  <Input
                    placeholder="modern-sofas"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-"),
                      }))
                    }
                    className="h-12 font-mono text-sm border-border/80 bg-surface focus-visible:ring-primary/30"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Taxonomy Base Type
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(v: CategoryType) =>
                      setForm((prev) => ({ ...prev, type: v }))
                    }
                  >
                    <SelectTrigger className="h-12 border-border/80 bg-surface focus-visible:ring-primary/30 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product Catalog</SelectItem>
                      <SelectItem value="portfolio">
                        Portfolio Galley
                      </SelectItem>
                      <SelectItem value="blog">Blog Articles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Parent Node Link
                  </Label>
                  <Select
                    value={form.parentId || "none"}
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        parentId: v === "none" ? null : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 border-border/80 bg-surface focus-visible:ring-primary/30 font-medium">
                      <SelectValue placeholder="No Parent (Top Level)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem
                        value="none"
                        className="font-bold text-primary"
                      >
                        -- No Parent Node (Standalone Key) --
                      </SelectItem>
                      {categories
                        .filter(
                          (c) => c.type === form.type && c._id !== editingId && c._id,
                        )
                        .map((c) => {
                          const n = c.title || "Unnamed";

                          return (
                            <SelectItem key={c._id} value={c._id!}>
                              {n}{" "}
                              <span className="text-muted-foreground block text-[10px] font-mono">
                                /{c.slug}
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Page Status
                  </Label>
                  <Select
                    value={form.pageStatus}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, pageStatus: v }))
                    }
                  >
                    <SelectTrigger className="h-12 border-border/80 bg-surface focus-visible:ring-primary/30 font-medium">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Banner Image URL
                  </Label>
                  <Input
                    placeholder="https://example.com/banner.jpg"
                    value={form.bannerImageUrl}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bannerImageUrl: e.target.value,
                      }))
                    }
                    className="h-12 border-border/80 bg-surface focus-visible:ring-primary/30 text-base"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                  Internal Description{" "}
                  <span className="font-normal opacity-60">(Optional)</span>
                </Label>
                <Textarea
                  placeholder="Describe what items live within this category node..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="min-h-[120px] resize-none border-border/80 bg-surface focus-visible:ring-primary/30 text-base"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Meta Title
                  </Label>
                  <Input
                    placeholder="SEO meta title"
                    value={form.metaTitle}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        metaTitle: e.target.value,
                      }))
                    }
                    className="h-12 border-border/80 bg-surface focus-visible:ring-primary/30 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Meta Description
                  </Label>
                  <Input
                    placeholder="SEO meta description"
                    value={form.metaDescription}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        metaDescription: e.target.value,
                      }))
                    }
                    className="h-12 border-border/80 bg-surface focus-visible:ring-primary/30 text-base"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="h-12 px-8 font-semibold rounded-xl border-border/80 hover:bg-muted"
                >
                  Cancel Setup
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-12 px-8 font-bold gap-2 rounded-xl text-md"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {editingId ? "Save Changes" : "Build Category"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Workspace & Tools */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border/70 rounded-2xl p-2 px-3 shadow-xs">
        <div className="flex gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(["", "product", "portfolio", "blog"] as const).map((type) => (
            <button
              key={type || "all"}
              onClick={() => setTypeFilter(type)}
              className={`px-5 py-2.5 rounded-xl text-[13px] whitespace-nowrap font-bold capitalize transition-all duration-200 ${
                typeFilter === type
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {type || "All Branches"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-[360px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Search hierarchy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 bg-surface border-border/60 focus-visible:ring-primary/30 rounded-xl text-sm transition-shadow font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Data Tree Rendering */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground bg-card rounded-3xl border border-border/50">
            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
            <span className="font-semibold tracking-wide">
              Syncing Taxonomy Matrix...
            </span>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 px-4 text-center bg-card rounded-3xl border border-border/50 shadow-sm">
            <div className="h-20 w-20 mb-6 rounded-2xl bg-muted/50 flex flex-col items-center justify-center text-muted-foreground shadow-inner border border-border">
              <FolderTree size={32} />
            </div>
            <h3 className="font-extrabold text-2xl mb-2 text-foreground">
              No Categories Found
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
              Your hierarchy is currently empty. Click the button below to
              initialize your first root category.
            </p>
            <Button
              onClick={() => openCreate(null)}
              className="h-12 px-8 font-bold shadow-md rounded-xl text-md"
            >
              Initialize Matrix
            </Button>
          </div>
        ) : (
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold w-[150px]">Level</TableHead>
                  <TableHead className="font-bold w-[120px]">
                    Sub-Items
                  </TableHead>
                  <TableHead className="font-bold text-right w-[150px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderRows(tree, 0)}</TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
