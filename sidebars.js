/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

// ref: https://docusaurus.io/docs/sidebar/items
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  istioSidebar: [
    {
      type: "doc",
      id: "README",
      customProps: {
        slug: "/"
      }
    },
    {
      type: 'category',
      label: '入门',
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/intro',
      },
      items: [
        'intro/service-governance',
      ],
    },
    {
      type: 'category',
      label: '最佳实践',
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/best-practices',
      },
      items: [
        'best-practices/graceful-shutdown',
        'best-practices/optimize-performance',
        'best-practices/specify-protocol',
        'best-practices/set-default-route',
      ],
    },
    {
      type: 'category',
      label: '用法实践',
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/usage'
      },
      items: [
        'usage/configure-accesslog',
        'usage/cors',
        'usage/iphash',
        'usage/websocket',
      ],
    },
    {
      type: 'category',
      label: '实用技巧',
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/trick'
      },
      items: [
        'trick/set-max-body-size',
        'trick/header-authorization',
        'trick/multi-version-test-service-with-prism',
        'trick/hide-server-header',
        'trick/debug',
        'trick/customize-proxy-loglevel',
      ],
    },
    {
      type: 'category',
      label: '实用 EnvoyFilter',
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/envoyfilter'
      },
      items: [
        'envoyfilter/accesslog'
      ],
    },
    {
      type: 'category',
      label: '常见问题',
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/faq'
      },
      items: [
        'faq/sidecar-shutdown',
        'faq/sidecar-startup-order',
        'faq/smart-dns',
        'faq/the-case-of-http-header',
        'faq/uppercase-header-causes-sticky-sessions-to-not-work',
        'faq/tracing',
        'faq/sidecar-injection',
        'faq/retries-for-non-idempotent-services',
        'faq/multicluster',
        'faq/listen-any',
        'faq/vs-match-order',
        'faq/headless-svc',
        'faq/grpc-not-loadbalancing',
      ],
    },
    {
      type: 'category',
      label: '故障排查',
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/troubleshooting',
      },
      items: [
        'troubleshooting/virtualservice-not-working',
        'troubleshooting/grpc-config-stream-closed',
        'troubleshooting/circuit-breaking-not-work',
        'troubleshooting/locality-lb-not-working',
        'troubleshooting/isito-init-crash',
        'troubleshooting/status-code-431',
        'troubleshooting/status-code-426',
        'troubleshooting/status-code-404',
        {
          type: 'category',
          label: '排障案例',
          collapsed: true,
          link: {
            type: 'generated-index',
            slug: '/troubleshooting/cases',
          },
          items: [
            'troubleshooting/cases/apollo-on-istio',
            'troubleshooting/cases/cannot-connect-pod-without-sidecar',
            'troubleshooting/cases/grpc-without-status-code',
            'troubleshooting/cases/istio-token-setup-failed-for-volume-istio-token',
            'troubleshooting/cases/traffic-policy-does-not-take-effect',
            'troubleshooting/cases/using-istio-reserved-port-causes-pod-start-failed',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '附录',
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/appendix'
      },
      items: [
        'appendix/link',
        'appendix/shell',
        'appendix/yaml',
        'appendix/envoyfilter',
      ],
    },
  ],
};

module.exports = sidebars;
