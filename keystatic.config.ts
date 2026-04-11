import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'your-github-username/bilder-site',
  },
  collections: {
    pages: collection({
      label: 'Pages',
      slugField: 'title',
      path: 'src/content/pages/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({
          label: 'SEO Description',
          multiline: true,
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Budget', value: 'budget' },
            { label: 'House Plans', value: 'house-plans' },
            { label: 'Choosing a Builder', value: 'choosing-a-builder' },
            { label: 'Building Materials', value: 'building-materials' },
            { label: 'Inclusions & Options', value: 'inclusions-and-options' },
            { label: 'Pre-Construction', value: 'pre-construction' },
            { label: 'Construction', value: 'construction' },
            { label: 'Other', value: 'other' },
          ],
          defaultValue: 'other',
        }),
        order: fields.number({ label: 'Order', defaultValue: 0 }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          dividers: true,
          links: true,
          tables: true,
          images: {
            directory: 'public/images',
            publicPath: '/images/',
          },
        }),
      },
    }),
  },
});
